import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URI;
import javax.net.ssl.HttpsURLConnection;
import javax.net.ssl.SSLContext;
import javax.net.ssl.TrustManager;
import javax.net.ssl.X509TrustManager;
import java.net.ConnectException;

public class serverBaseWOAuthJCA {
    public static void main(String[] args) {
        String url = "https://localhost:8080";  // Substitui com o endereço do teu servidor

        try {
            // Cria uma URL e abre uma conexão HttpURLConnection
            URI serverUri = new URI(url);
            HttpURLConnection urlConnection = (HttpURLConnection) serverUri.toURL().openConnection();

            // Configura a conexão para usar SSL sem autenticação de cliente
            if (urlConnection instanceof HttpsURLConnection) {
                HttpsURLConnection httpsUrlConnection = (HttpsURLConnection) urlConnection;
                SSLContext sslContext = SSLContext.getInstance("TLS");
                TrustManager[] trustAllCerts = new TrustManager[] { new X509TrustManager() {
                    public java.security.cert.X509Certificate[] getAcceptedIssuers() {
                        return null;
                    }
                    public void checkClientTrusted(java.security.cert.X509Certificate[] certs, String authType) {
                    }
                    public void checkServerTrusted(java.security.cert.X509Certificate[] certs, String authType) {
                    }
                }};
                sslContext.init(null, trustAllCerts, new java.security.SecureRandom());
                httpsUrlConnection.setSSLSocketFactory(sslContext.getSocketFactory());
            }

            // Lê a resposta do servidor
            try (BufferedReader in = new BufferedReader(new InputStreamReader(urlConnection.getInputStream()))) {
                String inputLine;
                StringBuilder content = new StringBuilder();
                while ((inputLine = in.readLine()) != null) {
                    content.append(inputLine);
                }
                System.out.println("Resposta do servidor:");
                System.out.println(content.toString());
            }
        } catch (ConnectException ce) {
            System.err.println("Erro de conexão: " + ce.getMessage());
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
