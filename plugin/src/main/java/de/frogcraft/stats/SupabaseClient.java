package de.frogcraft.stats;

import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

/** Blockierender REST-Client – nur von Async-Threads (oder beim Shutdown) aufrufen. */
final class SupabaseClient {
    private static final class ClientError extends IOException {
        ClientError(String m) { super(m); }
    }

    private final HttpClient http;
    private final String base;
    private final String key;
    private final int timeoutMs;
    private final int retries;

    SupabaseClient(String url, String key, int timeoutMs, int retries) {
        this.base = (url.endsWith("/") ? url.substring(0, url.length() - 1) : url) + "/rest/v1";
        this.key = key;
        this.timeoutMs = timeoutMs;
        this.retries = retries;
        this.http = HttpClient.newBuilder().version(HttpClient.Version.HTTP_1_1).connectTimeout(Duration.ofMillis(timeoutMs)).build();
    }

    JsonElement get(String path) throws IOException {
        return JsonParser.parseString(request("GET", path, null));
    }

    void rpc(String function, JsonObject args) throws IOException {
        request("POST", "/rpc/" + function, args.toString());
    }

    /** Ruft eine Funktion auf und liefert die Antwort (JSON). */
    JsonElement rpcGet(String function, JsonObject args) throws IOException {
        return JsonParser.parseString(request("POST", "/rpc/" + function, args.toString()));
    }

    void patch(String path, JsonObject body) throws IOException {
        request("PATCH", path, body.toString());
    }

    private String request(String method, String path, String body) throws IOException {
        IOException last = null;
        for (int attempt = 0; attempt <= retries; attempt++) {
            if (attempt > 0) {
                try { Thread.sleep(500L << (attempt - 1)); }
                catch (InterruptedException e) { Thread.currentThread().interrupt(); throw new IOException("unterbrochen", e); }
            }
            try {
                HttpRequest.Builder b = HttpRequest.newBuilder(URI.create(base + path))
                        .timeout(Duration.ofMillis(timeoutMs))
                        .header("apikey", key)
                        .header("Accept", "application/json")
                        .header("Content-Type", "application/json");
                if (key.startsWith("eyJ")) b.header("Authorization", "Bearer " + key); // nur für Legacy-JWT-Keys
                b.method(method, body == null ? HttpRequest.BodyPublishers.noBody() : HttpRequest.BodyPublishers.ofString(body));
                HttpResponse<String> r = http.send(b.build(), HttpResponse.BodyHandlers.ofString());
                int s = r.statusCode();
                if (s >= 200 && s < 300) return r.body();
                if (s < 500 && s != 429) throw new ClientError("HTTP " + s + " bei " + method + " " + path);
                last = new IOException("HTTP " + s + " bei " + method + " " + path);
            } catch (ClientError e) {
                throw e;
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                throw new IOException("unterbrochen", e);
            } catch (IOException e) {
                last = e;
            }
        }
        throw last != null ? last : new IOException("Unbekannter Fehler");
    }
}
