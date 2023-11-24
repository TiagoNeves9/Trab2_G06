import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;

public class HttpClientExample {

    public static void main(String[] args) {
        String url = "https://localhost:8080";  // Substitui com o endereço do teu servidor

        try {
            // Cria uma URL e abre uma conexão HttpURLConnection
            URL serverUrl = new URL(url);
            HttpURLConnection urlConnection = (HttpURLConnection) serverUrl.openConnection();

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
        } catch (IOException e) {
            e.printStackTrace();
        }
    }
}
