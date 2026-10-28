package de.frogcraft.stats;

import net.luckperms.api.LuckPerms;
import net.luckperms.api.node.Node;
import net.luckperms.api.node.types.InheritanceNode;
import org.bukkit.Server;
import org.bukkit.plugin.RegisteredServiceProvider;

import java.util.UUID;
import java.util.concurrent.CompletableFuture;

/** Ändert die Gruppenmitgliedschaft über die LuckPerms-API. Wird nur geladen, wenn LuckPerms installiert ist. */
final class LuckPermsHook implements GroupEditor {
    private final LuckPerms luckPerms;
    private final String group;

    private LuckPermsHook(LuckPerms luckPerms, String group) {
        this.luckPerms = luckPerms;
        this.group = group;
    }

    static LuckPermsHook create(Server server, String group) {
        RegisteredServiceProvider<LuckPerms> rsp = server.getServicesManager().getRegistration(LuckPerms.class);
        return rsp == null ? null : new LuckPermsHook(rsp.getProvider(), group);
    }

    @Override
    public CompletableFuture<Void> setMember(UUID player, boolean member) {
        Node node = InheritanceNode.builder(group).value(true).build();
        return luckPerms.getUserManager().modifyUser(player, user -> {
            if (member) user.data().add(node);
            else user.data().remove(node);
        });
    }
}
