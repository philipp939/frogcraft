package de.frogcraft.stats;

import org.bukkit.entity.Player;
import org.bukkit.event.EventHandler;
import org.bukkit.event.EventPriority;
import org.bukkit.event.Listener;
import org.bukkit.event.entity.PlayerDeathEvent;
import org.bukkit.event.player.PlayerJoinEvent;
import org.bukkit.event.player.PlayerQuitEvent;

final class StatsListener implements Listener {
    private final StatsTracker tracker;

    StatsListener(StatsTracker tracker) { this.tracker = tracker; }

    @EventHandler(priority = EventPriority.MONITOR)
    public void onJoin(PlayerJoinEvent e) { tracker.join(e.getPlayer()); }

    @EventHandler(priority = EventPriority.MONITOR)
    public void onQuit(PlayerQuitEvent e) { tracker.quit(e.getPlayer()); }

    /** Kills zählen nur, wenn ein anderer Spieler den Tod verursacht hat; Umwelttode und Selbsttötungen zählen nur als Death. */
    @EventHandler(priority = EventPriority.MONITOR)
    public void onDeath(PlayerDeathEvent e) {
        Player victim = e.getEntity();
        tracker.death(victim, victim.getKiller());
    }
}
