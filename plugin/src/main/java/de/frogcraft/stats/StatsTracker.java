package de.frogcraft.stats;

import com.google.gson.JsonObject;
import org.bukkit.Bukkit;
import org.bukkit.entity.Player;

import java.io.IOException;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Sammelt Kills/Deaths/Spielzeit als Deltas und überträgt sie atomar per RPC (player_add_stats).
 * Spielzeit: Pro Spieler wird ein Zeitmarker geführt, der nur um volle Minuten vorrückt – so wird nichts doppelt gezählt.
 */
final class StatsTracker {
    record Snap(Double balance, String rank) {}

    record Delta(String name, int kills, int deaths, long minutes) {
        Delta plus(Delta o) { return new Delta(o.name, kills + o.kills, deaths + o.deaths, minutes + o.minutes); }
        boolean empty() { return kills == 0 && deaths == 0 && minutes == 0; }
    }

    private final FrogCraftStats plugin;
    private final SupabaseClient db;
    private final Map<UUID, Delta> pending = new ConcurrentHashMap<>();
    private final Map<UUID, Long> marks = new ConcurrentHashMap<>();

    StatsTracker(FrogCraftStats plugin, SupabaseClient db) {
        this.plugin = plugin;
        this.db = db;
    }

    void join(Player p) {
        UUID id = p.getUniqueId();
        String name = p.getName();
        marks.put(id, System.currentTimeMillis());
        async(() -> {
            JsonObject a = new JsonObject();
            a.addProperty("p_uuid", id.toString());
            a.addProperty("p_username", name);
            try { db.rpc("player_login", a); }
            catch (IOException e) { plugin.getLogger().warning("Login-Sync fehlgeschlagen: " + e.getMessage()); }
        });
    }

    void death(Player victim, Player killer) {
        add(victim, 0, 1, 0);
        if (killer != null && !killer.getUniqueId().equals(victim.getUniqueId())) add(killer, 1, 0, 0);
    }

    void quit(Player p) {
        accrue(p);
        marks.remove(p.getUniqueId());
        UUID id = p.getUniqueId();
        Map<UUID, Snap> bal = new HashMap<>();
        snapshot(p, bal);
        async(() -> flushOne(id, bal));
    }

    /** Läuft auf dem Main Thread: Spielzeit verbuchen, Kontostände lesen, dann asynchron senden. */
    void tick() {
        Map<UUID, Snap> bal = new HashMap<>();
        for (Player p : Bukkit.getOnlinePlayers()) {
            accrue(p);
            snapshot(p, bal);
        }
        async(() -> flushAll(bal));
    }

    /** Beim Herunterfahren synchron senden (begrenzt durch Timeout × Retries). */
    void shutdown() {
        Map<UUID, Snap> bal = new HashMap<>();
        for (Player p : Bukkit.getOnlinePlayers()) {
            accrue(p);
            snapshot(p, bal);
        }
        flushAll(bal);
    }

    private void add(Player p, int k, int d, long m) {
        pending.merge(p.getUniqueId(), new Delta(p.getName(), k, d, m), Delta::plus);
    }

    private void accrue(Player p) {
        UUID id = p.getUniqueId();
        Long mark = marks.get(id);
        if (mark == null) return;
        long minutes = (System.currentTimeMillis() - mark) / 60_000L;
        if (minutes > 0) {
            marks.put(id, mark + minutes * 60_000L);
            add(p, 0, 0, minutes);
        }
    }

    private void snapshot(Player p, Map<UUID, Snap> out) {
        Double balance = null;
        String rank = null;
        Balances b = plugin.balances();
        if (b != null) {
            try { balance = Math.round(b.balance(p) * 100.0) / 100.0; }
            catch (RuntimeException e) { plugin.getLogger().warning("Kontostand von " + p.getName() + " nicht lesbar: " + e.getMessage()); }
        }
        Ranks r = plugin.ranks();
        if (r != null) {
            try { rank = r.primaryGroup(p); }
            catch (RuntimeException e) { plugin.getLogger().warning("Rang von " + p.getName() + " nicht lesbar: " + e.getMessage()); }
        }
        if (balance != null || rank != null) out.put(p.getUniqueId(), new Snap(balance, rank));
    }

    private void flushAll(Map<UUID, Snap> bal) {
        Set<UUID> ids = new HashSet<>(pending.keySet());
        ids.addAll(bal.keySet());
        for (UUID id : ids) flushOne(id, bal);
    }

    private void flushOne(UUID id, Map<UUID, Snap> bal) {
        Delta d = pending.remove(id);
        boolean sent = d == null || d.empty();
        try {
            if (!sent) {
                JsonObject a = new JsonObject();
                a.addProperty("p_uuid", id.toString());
                a.addProperty("p_username", d.name());
                a.addProperty("p_kills", d.kills());
                a.addProperty("p_deaths", d.deaths());
                a.addProperty("p_playtime_minutes", d.minutes());
                db.rpc("player_add_stats", a);
                sent = true;
            }
            Snap sn = bal.get(id);
            if (sn != null) {
                JsonObject body = new JsonObject();
                if (sn.balance() != null) body.addProperty("balance", sn.balance());
                if (sn.rank() != null) body.addProperty("rank_group", sn.rank());
                if (body.size() > 0) db.patch("/pvp_players?uuid=eq." + id, body);
            }
        } catch (IOException e) {
            if (!sent && d != null) pending.merge(id, d, Delta::plus); // später erneut versuchen
            plugin.getLogger().warning("Sync fehlgeschlagen (" + e.getMessage() + ") – neuer Versuch beim nächsten Intervall.");
        }
    }

    private void async(Runnable r) {
        try { plugin.getServer().getScheduler().runTaskAsynchronously(plugin, r); }
        catch (IllegalStateException ignored) { /* Plugin wird gerade deaktiviert */ }
    }
}
