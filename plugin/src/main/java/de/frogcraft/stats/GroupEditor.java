package de.frogcraft.stats;

import java.util.UUID;
import java.util.concurrent.CompletableFuture;

interface GroupEditor {
    /** Fügt den Spieler (auch offline) der PvP-Gruppe hinzu oder entfernt ihn daraus. */
    CompletableFuture<Void> setMember(UUID player, boolean member);
}
