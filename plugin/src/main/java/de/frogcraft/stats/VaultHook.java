package de.frogcraft.stats;

import net.milkbowl.vault.economy.Economy;
import org.bukkit.OfflinePlayer;
import org.bukkit.Server;
import org.bukkit.plugin.RegisteredServiceProvider;

/** Wird nur geladen, wenn Vault installiert ist. */
final class VaultHook implements Balances {
    private final Economy economy;

    private VaultHook(Economy economy) { this.economy = economy; }

    static VaultHook create(Server server) {
        RegisteredServiceProvider<Economy> rsp = server.getServicesManager().getRegistration(Economy.class);
        return rsp == null ? null : new VaultHook(rsp.getProvider());
    }

    @Override
    public double balance(OfflinePlayer player) { return economy.getBalance(player); }
}
