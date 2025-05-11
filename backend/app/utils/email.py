import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import List, Optional

from app.config import settings


def send_email(
        to_email: List[str],
        subject: str,
        html_content: str,
        cc: Optional[List[str]] = None,
        bcc: Optional[List[str]] = None
) -> bool:
    """Send an email using SMTP server defined in settings."""

    if not settings.MAIL_USERNAME or not settings.MAIL_PASSWORD:
        # In development, just print the email content
        print(f"To: {to_email}")
        print(f"Subject: {subject}")
        print(f"Content: {html_content}")
        return True

    message = MIMEMultipart("alternative")
    message["Subject"] = subject
    message["From"] = f"{settings.MAIL_FROM_NAME} <{settings.MAIL_FROM}>"
    message["To"] = ", ".join(to_email)

    if cc:
        message["Cc"] = ", ".join(cc)
    if bcc:
        message["Bcc"] = ", ".join(bcc)

    # Add HTML content
    html_part = MIMEText(html_content, "html")
    message.attach(html_part)

    try:
        server = smtplib.SMTP(settings.MAIL_SERVER, settings.MAIL_PORT)
        server.starttls()
        server.login(settings.MAIL_USERNAME, settings.MAIL_PASSWORD)

        recipients = to_email.copy()
        if cc:
            recipients.extend(cc)
        if bcc:
            recipients.extend(bcc)

        server.sendmail(settings.MAIL_FROM, recipients, message.as_string())
        server.quit()
        return True
    except Exception as e:
        print(f"Failed to send email: {str(e)}")
        return False


def send_verification_email(to_email: str, verification_code: str) -> bool:
    """Send a verification email to the user."""
    subject = "Verify your LinkedOut account"
    html_content = f"""
    <html>
        <body>
            <h1>Welcome to LinkedOut!</h1>
            <p>Please verify your email address by clicking the link below:</p>
            <p><a href="http://localhost:3000/verify-email?token={verification_code}">Verify Email</a></p>
            <p>If you didn't sign up for LinkedOut, please ignore this email.</p>
        </body>
    </html>
    """
    return send_email([to_email], subject, html_content)


def send_password_reset_email(to_email: str, reset_token: str) -> bool:
    """Send a password reset email to the user."""
    subject = "Reset your LinkedOut password"
    html_content = f"""
    <html>
        <body>
            <h1>Reset your password</h1>
            <p>Click the link below to reset your password:</p>
            <p><a href="http://localhost:3000/reset-password?token={reset_token}">Reset Password</a></p>
            <p>If you didn't request a password reset, please ignore this email.</p>
        </body>
    </html>
    """
    return send_email([to_email], subject, html_content)