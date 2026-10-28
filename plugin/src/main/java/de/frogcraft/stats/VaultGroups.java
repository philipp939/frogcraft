package de.frogcraft.stats;

import net.milkbowl.vault.permission.Permission;
import org.bukkit.Server;
import org.bukkit.entity.Player;
import org.bukkit.plugin.RegisteredServiceProvider;

import java.util.Locale;

/** Liest die Gruppe über Vault (LuckPerms stellt die Vault-Schnittstelle bereit). Wird nur geladen, wenn Vault installiert ist. */
final class VaultGroups implements Ranks {
    private final Permission permission;

    private VaultGroups(Permission permission) { this.permission = permission; }

    static VaultGroups create(Server server) {
        RegisteredServiceProvider<Permission> rsp = server.getServicesManager().getRegistration(Permission.class);
        return rsp == null ? null : new VaultGroups(rsp.getProvider());
    }

    @Override
    public String primaryGroup(Player player) {
        String g = permission.getPrimaryGroup(player);
        return g == null || g.isBlank() ? null : g.trim().toLowerCase(Locale.ROOT);
    }
}
