CREATE DATABASE linkedout_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'linkedout_user'@'localhost' IDENTIFIED BY 'linkedout_password';
GRANT ALL PRIVILEGES ON linkedout_db.* TO 'linkedout_user'@'localhost';
FLUSH PRIVILEGES;