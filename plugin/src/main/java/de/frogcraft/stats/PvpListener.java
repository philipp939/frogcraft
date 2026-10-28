package de.frogcraft.stats;

import net.kyori.adventure.text.Component;
import net.kyori.adventure.text.format.NamedTextColor;
import org.bukkit.entity.Entity;
import org.bukkit.entity.Player;
import org.bukkit.entity.Projectile;
import org.bukkit.event.EventHandler;
import org.bukkit.event.EventPriority;
import org.bukkit.event.Listener;
import org.bukkit.event.entity.EntityCombustByEntityEvent;
import org.bukkit.event.entity.EntityDamageByEntityEvent;
import org.bukkit.event.player.PlayerJoinEvent;
import org.bukkit.event.player.PlayerQuitEvent;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/** Blockiert Spieler-gegen-Spieler-Schaden, wenn Angreifer ODER Opfer kein aktives PvP haben. */
final class PvpListener implements Listener {
    private static final long MSG_COOLDOWN_MS = 2000L;
    private final PvpManager pvp;
    private final Map<UUID, Long> lastMessage = new ConcurrentHashMap<>();

    PvpListener(PvpManager pvp) { this.pvp = pvp; }

    @EventHandler(priority = EventPriority.HIGH, ignoreCancelled = true)
    public void onDamage(EntityDamageByEntityEvent e) {
        if (!(e.getEntity() instanceof Player victim)) return;
        Player attacker = attacker(e.getDamager());
        if (attacker == null || attacker.getUniqueId().equals(victim.getUniqueId())) return;
        if (!pvp.allowed(attacker) || !pvp.allowed(victim)) {
            e.setCancelled(true);
            warn(attacker, victim);
        }
    }

    /** Verhindert z. B. Feuerpfeile gegen Spieler ohne PvP. */
    @EventHandler(priority = EventPriority.HIGH, ignoreCancelled = true)
    public void onCombust(EntityCombustByEntityEvent e) {
        if (!(e.getEntity() instanceof Player victim)) return;
        Player attacker = attacker(e.getCombuster());
        if (attacker == null || attacker.getUniqueId().equals(victim.getUniqueId())) return;
        if (!pvp.allowed(attacker) || !pvp.allowed(victim)) e.setCancelled(true);
    }

    @EventHandler(priority = EventPriority.MONITOR)
    public void onJoin(PlayerJoinEvent e) { pvp.joined(e.getPlayer()); }

    @EventHandler(priority = EventPriority.MONITOR)
    public void onQuit(PlayerQuitEvent e) {
        lastMessage.remove(e.getPlayer().getUniqueId());
    }

    private static Player attacker(Entity damager) {
        if (damager instanceof Player p) return p;
        if (damager instanceof Projectile pr && pr.getShooter() instanceof Player p) return p;
        return null;
    }

    private void warn(Player attacker, Player victim) {
        long now = System.currentTimeMillis();
        Long last = lastMessage.get(attacker.getUniqueId());
        if (last != null && now - last < MSG_COOLDOWN_MS) return;
        lastMessage.put(attacker.getUniqueId(), now);
        String text = !pvp.allowed(attacker)
                ? "Du hast kein aktives PvP."
                : victim.getName() + " hat kein aktives PvP.";
        attacker.sendMessage(Component.text(text, NamedTextColor.RED));
    }
}
