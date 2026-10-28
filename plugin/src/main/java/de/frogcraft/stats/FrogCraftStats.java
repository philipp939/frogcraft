package de.frogcraft.stats;

import org.bukkit.Bukkit;
import org.bukkit.configuration.file.FileConfiguration;
import org.bukkit.entity.Player;
import org.bukkit.plugin.java.JavaPlugin;

import java.util.ArrayList;

public final class FrogCraftStats extends JavaPlugin {
    private SupabaseClient db;
    private StatsTracker tracker;
    private Balances balances;
    private boolean vaultWarned;
    private Ranks ranks;
    private boolean ranksWarned;

    @Override
    public void onEnable() {
        saveDefaultConfig();
        FileConfiguration c = getConfig();
        String url = c.getString("supabase.url", "").trim();
        String key = c.getString("supabase.secret-key", "").trim();
        if (!url.startsWith("https://") || url.contains("DEIN-PROJEKT") || key.isEmpty() || key.contains("HIER-")) {
            getLogger().severe("supabase.url / supabase.secret-key in config.yml fehlen oder sind noch Platzhalter. Plugin wird deaktiviert.");
            getServer().getPluginManager().disablePlugin(this);
            return;
        }
        int timeout = Math.max(1000, c.getInt("http.timeout-ms", 5000));
        int retries = Math.min(5, Math.max(0, c.getInt("http.retries", 2)));
        long seconds = Math.max(10, c.getInt("sync-interval-seconds", 60));

        db = new SupabaseClient(url, key, timeout, retries);
        tracker = new StatsTracker(this, db);
        getServer().getPluginManager().registerEvents(new StatsListener(tracker), this);
        TopCommand top = new TopCommand(this, db);
        var cmd = getCommand("top");
        if (cmd != null) { cmd.setExecutor(top); cmd.setTabCompleter(top); }

        String permission = c.getString("pvp.permission", "pvp").trim();
        String group = c.getString("pvp.group", "pvp").trim();
        GroupEditor editor = getServer().getPluginManager().getPlugin("LuckPerms") != null
                ? LuckPermsHook.create(getServer(), group.isEmpty() ? "pvp" : group) : null;
        PvpManager pvp = new PvpManager(this, db, permission.isEmpty() ? "pvp" : permission, editor);
        getServer().getPluginManager().registerEvents(new PvpListener(pvp), this);
        PlayerCommands playerCommands = new PlayerCommands(this, db, pvp);
        for (String name : new String[]{"verify", "pvp"}) {
            var pc = getCommand(name);
            if (pc != null) pc.setExecutor(playerCommands);
        }
        for (Player op : Bukkit.getOnlinePlayers()) pvp.joined(op); // z. B. nach /reload

        long ticks = seconds * 20L;
        Bukkit.getScheduler().runTaskTimer(this, tracker::tick, ticks, ticks);
        for (Player p : Bukkit.getOnlinePlayers()) tracker.join(p); // z. B. nach /reload
        getLogger().info("FrogCraftStats aktiv. Sync alle " + seconds + " s.");
    }

    @Override
    public void onDisable() {
        if (tracker != null) tracker.shutdown();
    }

    /** Liefert die Gruppen-Schnittstelle (Vault/LuckPerms), sobald verfügbar (sonst null). */
    Ranks ranks() {
        if (ranks == null && getServer().getPluginManager().getPlugin("Vault") != null) {
            ranks = VaultGroups.create(getServer());
        }
        if (ranks == null && !ranksWarned) {
            ranksWarned = true;
            getLogger().warning("Keine Vault-Permission-Schnittstelle gefunden (ist LuckPerms installiert?) – Ränge werden nicht übertragen.");
        }
        return ranks;
    }

    /** Liefert die Vault-Economy, sobald ein Provider registriert ist (sonst null). */
    Balances balances() {
        if (balances == null && getServer().getPluginManager().getPlugin("Vault") != null) {
            balances = VaultHook.create(getServer());
        }
        if (balances == null && !vaultWarned) {
            vaultWarned = true;
            getLogger().warning("Keine Vault-Economy gefunden – Kontostände werden nicht übertragen.");
        }
        return balances;
    }
}
