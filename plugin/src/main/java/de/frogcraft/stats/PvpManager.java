package de.frogcraft.stats;

import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import org.bukkit.entity.Player;

import java.io.IOException;
import java.util.UUID;

/**
 * PvP hängt allein an der Permission (z. B. über die LuckPerms-Gruppe "pvp").
 * Die Website speichert nur den Wunsch des Spielers in Supabase (pvp_enabled + pvp_pending).
 * Dieses Plugin führt ihn beim Beitritt des Spielers aus (Gruppe hinzufügen/entfernen) und gleicht danach den
 * Website-Stand mit der tatsächlichen Permission ab. Es gibt keine regelmäßigen Abfragen.
 */
final class PvpManager {
    private final FrogCraftStats plugin;
    private final SupabaseClient db;
    private final String permission;
    private final GroupEditor editor;
    private volatile boolean editorWarned;

    PvpManager(FrogCraftStats plugin, SupabaseClient db, String permission, GroupEditor editor) {
        this.plugin = plugin;
        this.db = db;
        this.permission = permission;
        this.editor = editor;
    }

    boolean hasPermission(Player p) { return p.hasPermission(permission); }

    boolean allowed(Player p) { return hasPermission(p); }

    /** Beim Beitritt (Main Thread). Wartet 2 s, bis der Spieler-Eintrag in Supabase sicher existiert. */
    void joined(Player p) {
        UUID id = p.getUniqueId();
        boolean actual = hasPermission(p);
        try { plugin.getServer().getScheduler().runTaskLaterAsynchronously(plugin, () -> sync(id, actual), 40L); }
        catch (IllegalStateException ignored) { /* Plugin wird deaktiviert */ }
    }

    private void sync(UUID id, boolean actual) {
        try {
            JsonArray rows = db.get("/pvp_players?select=pvp_enabled,pvp_pending&uuid=eq." + id).getAsJsonArray();
            if (rows.isEmpty()) return;
            JsonObject o = rows.get(0).getAsJsonObject();
            boolean enabled = o.get("pvp_enabled").getAsBoolean();
            boolean pending = o.get("pvp_pending").getAsBoolean();
            if (pending) {
                apply(id, enabled);
            } else if (enabled != actual) {
                // Admin hat die Gruppe von Hand geändert: Website-Anzeige angleichen
                JsonObject body = new JsonObject();
                body.addProperty("pvp_enabled", actual);
                db.patch("/pvp_players?uuid=eq." + id + "&pvp_pending=eq.false", body);
            }
        } catch (IOException | RuntimeException e) {
            plugin.getLogger().warning("PvP-Abgleich fehlgeschlagen: " + e.getMessage());
        }
    }

    private void apply(UUID id, boolean want) {
        if (editor == null) {
            if (!editorWarned) {
                editorWarned = true;
                plugin.getLogger().warning("LuckPerms nicht gefunden – PvP-Änderungen von der Website können nicht ausgeführt werden.");
            }
            return;
        }
        editor.setMember(id, want).whenComplete((v, ex) -> {
            if (ex != null) {
                plugin.getLogger().warning("PvP-Gruppe konnte nicht geändert werden: " + ex.getMessage());
                return;
            }
            try { plugin.getServer().getScheduler().runTaskAsynchronously(plugin, () -> clearPending(id, want)); }
            catch (IllegalStateException ignored) { /* Plugin wird deaktiviert */ }
        });
    }

    /** Markiert die Änderung als erledigt – nur, wenn der Wunsch sich inzwischen nicht erneut geändert hat. */
    private void clearPending(UUID id, boolean want) {
        try {
            JsonObject body = new JsonObject();
            body.addProperty("pvp_pending", false);
            db.patch("/pvp_players?uuid=eq." + id + "&pvp_enabled=eq." + want, body);
        } catch (IOException e) {
            plugin.getLogger().warning("PvP-Änderung konnte nicht bestätigt werden: " + e.getMessage());
        }
    }
}
