<?php
// mailer.php - Standalone SMTP mailer for Olivarez College Store Supply
// Works without any external composer dependencies

define('SMTP_HOST', 'smtp.gmail.com');
define('SMTP_PORT', 465); // SSL port

// ─────────────────────────────────────────────────────────────
// CONFIGURATION:
// To enable actual email delivery via Gmail:
// 1. Enter your Gmail address in SMTP_USER
// 2. Generate a 16-character Google "App Password" (myaccount.google.com/apppasswords)
// 3. Put it in SMTP_PASS (without spaces)
// ─────────────────────────────────────────────────────────────
define('SMTP_USER', 'fernanjoshcarl7@gmail.com'); 
define('SMTP_PASS', 'gksifpsgmnjbefco'); 
define('SMTP_FROM_NAME', 'Olivarez College Uniform Store');

function sendVerificationEmail($toEmail, $studentName, $otpCode) {
    if (empty(SMTP_USER) || empty(SMTP_PASS)) {
        return [
            "success" => false,
            "configured" => false,
            "message" => "SMTP not configured yet. Configure SMTP_USER and SMTP_PASS in mailer.php."
        ];
    }

    $subject = "Your Olivarez College Store Verification Code: " . $otpCode;
    $from     = SMTP_USER;
    $fromName = SMTP_FROM_NAME;

    $htmlBody = "
    <!DOCTYPE html>
    <html>
    <head><meta charset='UTF-8'></head>
    <body style='font-family: -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, Helvetica, Arial, sans-serif; background-color: #f4f6f8; margin: 0; padding: 24px;'>
      <div style='max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 14px; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,0.08); border: 1px solid #e1e7e4;'>
        <div style='background-color: #1a5c2e; padding: 26px 20px; text-align: center;'>
          <h1 style='color: #ffffff; margin: 0; font-size: 24px; letter-spacing: 0.5px;'>Olivarez College</h1>
          <p style='color: #c9a84c; margin: 6px 0 0 0; font-size: 13px; font-weight: 700; letter-spacing: 1px;'>UNIFORM STORE SUPPLY</p>
        </div>
        <div style='padding: 30px 24px;'>
          <p style='font-size: 16px; color: #222222; margin-top: 0;'>Kumusta, <b>" . htmlspecialchars($studentName) . "</b>!</p>
          <p style='font-size: 14px; color: #555555; line-height: 1.6;'>
            Salamat sa pag-register sa <b>Olivarez College Uniform Store Supply</b> portal. Gamitin ang 6-digit verification code sa ibaba upang i-verify ang iyong account:
          </p>
          <div style='text-align: center; margin: 28px 0;'>
            <div style='display: inline-block; background-color: #f0f9f2; border: 2px dashed #1a5c2e; border-radius: 12px; padding: 16px 32px;'>
              <span style='font-size: 34px; font-weight: 800; letter-spacing: 8px; color: #1a5c2e; font-family: monospace;'>" . htmlspecialchars($otpCode) . "</span>
            </div>
          </div>
          <p style='font-size: 13px; color: #888888; text-align: center; margin-bottom: 0;'>
            ⏰ Ang code na ito ay may bisa lamang sa loob ng <b>5 minuto</b>.
          </p>
        </div>
        <div style='background-color: #f9fbf9; padding: 16px 20px; border-top: 1px solid #eef2ef; text-align: center;'>
          <p style='font-size: 12px; color: #888888; margin: 0;'>
            Kung hindi ikaw ang humiling ng verification code na ito, mangyaring balewalain ang email na ito. Huwag ibahagi ang iyong code kaninuman para sa seguridad ng iyong account.
          </p>
        </div>
      </div>
    </body>
    </html>
    ";

    return sendSmtpMail($toEmail, $subject, $htmlBody, $from, $fromName);
}

function sendSmtpMail($to, $subject, $htmlBody, $from, $fromName) {
    $timeout = 4;
    $context = stream_context_create([
        'ssl' => [
            'verify_peer' => false,
            'verify_peer_name' => false,
            'allow_self_signed' => true
        ]
    ]);

    $socket = @stream_socket_client("ssl://" . SMTP_HOST . ":" . SMTP_PORT, $errno, $errstr, $timeout, STREAM_CLIENT_CONNECT, $context);
    if (!$socket) {
        return ["success" => false, "message" => "Could not connect to SMTP server: $errstr ($errno)"];
    }

    $read = function() use ($socket) {
        $res = "";
        while ($line = fgets($socket, 515)) {
            $res .= $line;
            if (substr($line, 3, 1) == " ") break;
        }
        return $res;
    };

    $send = function($cmd) use ($socket, $read) {
        fputs($socket, $cmd . "\r\n");
        return $read();
    };

    $read(); // greeting
    $send("EHLO localhost");
    $send("AUTH LOGIN");
    $send(base64_encode(SMTP_USER));
    $authRes = $send(base64_encode(SMTP_PASS));

    if (substr($authRes, 0, 3) != "235") {
        fclose($socket);
        return ["success" => false, "message" => "SMTP Authentication failed: " . trim($authRes)];
    }

    $send("MAIL FROM: <$from>");
    $send("RCPT TO: <$to>");
    $send("DATA");

    $headers  = "MIME-Version: 1.0\r\n";
    $headers .= "From: =?UTF-8?B?" . base64_encode($fromName) . "?= <$from>\r\n";
    $headers .= "To: <$to>\r\n";
    $headers .= "Subject: =?UTF-8?B?" . base64_encode($subject) . "?=\r\n";
    $headers .= "Content-Type: text/html; charset=UTF-8\r\n";
    $headers .= "Content-Transfer-Encoding: 8bit\r\n";

    $message = $headers . "\r\n" . $htmlBody . "\r\n.\r\n";
    fputs($socket, $message);
    $dataRes = $read();

    $send("QUIT");
    fclose($socket);

    return ["success" => true, "message" => "Email sent successfully"];
}
