package de.frogcraft.stats;

import org.bukkit.entity.Player;

interface Ranks {
    /** Primäre Gruppe des Spielers (z. B. "default", "mod") oder null. */
    String primaryGroup(Player player);
}
