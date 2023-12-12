import javax.net.ssl.*;
import java.io.FileInputStream;
import java.security.KeyStore;
import java.util.Scanner;

public class serverBaseWOAuthJCA {
    public static void main(String[] args) throws Exception {
        Scanner scanner = new Scanner(System.in);

        TrustManagerFactory tmf = TrustManagerFactory.getInstance(TrustManagerFactory.getDefaultAlgorithm());
        KeyStore ks = KeyStore.getInstance("JKS");
        ks.load(new FileInputStream("C:\\Users\\tiago\\OneDrive\\Ambiente de Trabalho\\5Semestre\\SEGINF\\Trab2\\Trab2_G06\\Exe6\\b\\CA.jks"), "changeit".toCharArray());
        tmf.init(ks);

        SSLContext sc = SSLContext.getInstance("TLS");
        sc.init(null, tmf.getTrustManagers(), null);
        SSLSocketFactory sslFactory = sc.getSocketFactory();

        SSLSocket client = (SSLSocket) sslFactory.createSocket("localhost", 4433);
        client.startHandshake();
        SSLSession session = client.getSession();
        System.out.println(session.getCipherSuite());
        System.out.println(session.getPeerCertificates()[0]);

        scanner.nextLine();
        scanner.close();
        client.close();
    }
}