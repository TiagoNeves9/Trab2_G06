import javax.net.ssl.*;

import java.io.BufferedReader;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.PrintStream;
import java.security.KeyManagementException;
import java.security.KeyStore;
import java.security.KeyStoreException;
import java.security.NoSuchAlgorithmException;
import java.security.cert.CertificateException;

public class serverBaseWOAuthJCA {
    public static void main(String[] args) throws IOException, NoSuchAlgorithmException, KeyStoreException, CertificateException, KeyManagementException {

        // Carregar o keystore com o certificado do cliente
        KeyStore ks = KeyStore.getInstance("JKS");
        ks.load(new FileInputStream("CA.jks"), "changeit".toCharArray());

        // Configurar o TrustManager(se deve ou não confiar em certificados de servidor) para o keystore do cliente
        TrustManagerFactory tmf = TrustManagerFactory.getInstance("PKIX");
        tmf.init(ks);

        // Criar um contexto SSL e configurar TrustManagerFactory
        SSLContext sc = SSLContext.getInstance("TLS");
        sc.init(null, tmf.getTrustManagers(), null);

        // Criar uma fábrica de sockets SSL
        SSLSocketFactory sslFactory = sc.getSocketFactory();

        // print cipher suites avaliable at the client
        String[] cipherSuites = sslFactory.getSupportedCipherSuites();
        for (int i=0; i<cipherSuites.length; ++i) {
            System.out.println("option " + i + " " + cipherSuites[i]);
        }

        // Estabelecer conexão com o servidor HTTPS
        SSLSocket client = (SSLSocket) sslFactory.createSocket("www.secure-server.edu", 8080);
        client.startHandshake();

        // Obter informações sobre a sessão SSL estabelecida
        SSLSession session = client.getSession();
        System.out.println("Cipher suite: " + session.getCipherSuite());
        System.out.println("Protocol version: " + session.getProtocol());
        System.out.println(session.getPeerCertificates()[0]);

        // REQUEST
        PrintStream out = new PrintStream(client.getOutputStream());
        out.println("GET " + " HTTP/1.1");
        out.println();

        // RESPONSE
        BufferedReader in = new BufferedReader(new InputStreamReader(client.getInputStream()));
        String line;
        while (in.ready() && ((line = in.readLine()) != null))
            System.out.println(line);

        // CLOSE STREAMS
        in.close();
        out.close();
        client.close();

        // Fechar a conexão
        client.close();
    }
}
