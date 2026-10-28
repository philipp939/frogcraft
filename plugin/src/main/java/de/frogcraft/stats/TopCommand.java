package de.frogcraft.stats;

import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import net.kyori.adventure.text.Component;
import net.kyori.adventure.text.format.NamedTextColor;
import org.bukkit.command.Command;
import org.bukkit.command.CommandExecutor;
import org.bukkit.command.CommandSender;
import org.bukkit.command.TabCompleter;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/** /top <geld|kills|zeit> – Top 10 aus Supabase, 30 Sekunden gecacht. */
final class TopCommand implements CommandExecutor, TabCompleter {
    private record Cached(long at, List<Component> lines) {}
    private static final long TTL_MS = 30_000L;

    private final FrogCraftStats plugin;
    private final SupabaseClient db;
    private final Map<String, Cached> cache = new ConcurrentHashMap<>();

    TopCommand(FrogCraftStats plugin, SupabaseClient db) {
        this.plugin = plugin;
        this.db = db;
    }

    @Override
    public boolean onCommand(CommandSender sender, Command cmd, String label, String[] args) {
        String arg = args.length > 0 ? args[0].toLowerCase(Locale.ROOT) : "kills";
        String col;
        String title;
        switch (arg) {
            case "geld", "money", "balance" -> { col = "balance"; title = "Reichste Spieler"; }
            case "kills" -> { col = "kills"; title = "Meiste Kills"; }
            case "zeit", "spielzeit", "playtime" -> { col = "playtime_minutes"; title = "Längste Spielzeit"; }
            default -> {
                sender.sendMessage(Component.text("Benutzung: /" + label + " <geld|kills|zeit>", NamedTextColor.YELLOW));
                return true;
            }
        }
        Cached c = cache.get(col);
        if (c != null && System.currentTimeMillis() - c.at() < TTL_MS) {
            c.lines().forEach(sender::sendMessage);
            return true;
        }
        final String column = col;
        final String heading = title;
        plugin.getServer().getScheduler().runTaskAsynchronously(plugin, () -> {
            List<Component> lines = new ArrayList<>();
            try {
                JsonArray rows = db.get("/pvp_players?select=username,kills,balance,playtime_minutes&hidden=eq.false&order="
                        + column + ".desc&limit=10").getAsJsonArray();
                lines.add(Component.text("— " + heading + " —", NamedTextColor.GREEN));
                int i = 1;
                for (JsonElement el : rows) {
                    JsonObject o = el.getAsJsonObject();
                    lines.add(Component.text(i++ + ". ", NamedTextColor.GRAY)
                            .append(Component.text(o.get("username").getAsString(), NamedTextColor.WHITE))
                            .append(Component.text("  " + format(column, o.get(column).getAsDouble()), NamedTextColor.GOLD)));
                }
                if (rows.isEmpty()) lines.add(Component.text("Noch keine Einträge.", NamedTextColor.GRAY));
                cache.put(column, new Cached(System.currentTimeMillis(), lines));
            } catch (IOException | RuntimeException e) {
                plugin.getLogger().warning("/top fehlgeschlagen: " + e.getMessage());
                lines.clear();
                lines.add(Component.text("Rangliste gerade nicht verfügbar.", NamedTextColor.RED));
            }
            plugin.getServer().getScheduler().runTask(plugin, () -> lines.forEach(sender::sendMessage));
        });
        return true;
    }

    private static String format(String col, double v) {
        return switch (col) {
            case "balance" -> String.format(Locale.GERMANY, "%,.2f $", v);
            case "playtime_minutes" -> (long) v / 60 + " Std. " + (long) v % 60 + " Min.";
            default -> String.format(Locale.GERMANY, "%,.0f", v);
        };
    }

    @Override
    public List<String> onTabComplete(CommandSender sender, Command cmd, String alias, String[] args) {
        return args.length == 1 ? List.of("geld", "kills", "zeit") : List.of();
    }
}
