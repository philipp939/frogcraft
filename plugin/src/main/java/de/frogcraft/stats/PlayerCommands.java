package de.frogcraft.stats;

import com.google.gson.JsonObject;
import net.kyori.adventure.text.Component;
import net.kyori.adventure.text.format.NamedTextColor;
import org.bukkit.command.Command;
import org.bukkit.command.CommandExecutor;
import org.bukkit.command.CommandSender;
import org.bukkit.entity.Player;

import java.io.IOException;
import java.util.Locale;

/** /verify <code> – Website-Konto bestätigen; /pvp – eigenen PvP-Status anzeigen. */
final class PlayerCommands implements CommandExecutor {
    private final FrogCraftStats plugin;
    private final SupabaseClient db;
    private final PvpManager pvp;

    PlayerCommands(FrogCraftStats plugin, SupabaseClient db, PvpManager pvp) {
        this.plugin = plugin;
        this.db = db;
        this.pvp = pvp;
    }

    @Override
    public boolean onCommand(CommandSender sender, Command cmd, String label, String[] args) {
        if (!(sender instanceof Player player)) {
            sender.sendMessage("Dieser Befehl ist nur für Spieler.");
            return true;
        }
        if (cmd.getName().equalsIgnoreCase("pvp")) {
            boolean active = pvp.hasPermission(player);
            player.sendMessage(Component.text("PvP: ", NamedTextColor.GRAY)
                    .append(active ? Component.text("AKTIV", NamedTextColor.GREEN) : Component.text("AUS", NamedTextColor.RED)));
            if (!active) player.sendMessage(Component.text("Du bist nicht in der PvP-Gruppe. Du kannst PvP auf der Website einschalten.", NamedTextColor.GRAY));
            return true;
        }
        // /verify
        if (args.length != 1 || !args[0].matches("[A-Za-z0-9]{4,16}")) {
            player.sendMessage(Component.text("Benutzung: /" + label + " <Code von der Website>", NamedTextColor.YELLOW));
            return true;
        }
        String code = args[0].toUpperCase(Locale.ROOT);
        plugin.getServer().getScheduler().runTaskAsynchronously(plugin, () -> {
            Component msg;
            try {
                JsonObject a = new JsonObject();
                a.addProperty("p_uuid", player.getUniqueId().toString());
                a.addProperty("p_code", code);
                String result = db.rpcGet("account_verify", a).getAsString();
                msg = switch (result) {
                    case "ok" -> Component.text("Dein Konto ist verifiziert! Du kannst dich jetzt auf der Website anmelden.", NamedTextColor.GREEN);
                    case "already" -> Component.text("Dein Konto ist bereits verifiziert.", NamedTextColor.YELLOW);
                    case "expired" -> Component.text("Der Code ist abgelaufen. Fordere auf der Website einen neuen an.", NamedTextColor.RED);
                    case "no_account" -> Component.text("Zu deinem Namen gibt es noch kein Website-Konto. Registriere dich zuerst auf der Website.", NamedTextColor.RED);
                    default -> Component.text("Der Code ist falsch.", NamedTextColor.RED);
                };
            } catch (IOException | RuntimeException e) {
                plugin.getLogger().warning("/verify fehlgeschlagen: " + e.getMessage());
                msg = Component.text("Verifizierung gerade nicht möglich. Bitte versuche es später erneut.", NamedTextColor.RED);
            }
            Component out = msg;
            plugin.getServer().getScheduler().runTask(plugin, () -> player.sendMessage(out));
        });
        return true;
    }
}
