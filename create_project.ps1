# PowerShell versiyonu - create_project.ps1

# Ana klasör yapısını oluştur
New-Item -Path "project" -ItemType Directory -Force | Out-Null
New-Item -Path "project\frontend" -ItemType Directory -Force | Out-Null
New-Item -Path "project\backend" -ItemType Directory -Force | Out-Null

# Frontend yapısını oluştur
New-Item -Path "project\frontend\public\assets\images" -ItemType Directory -Force | Out-Null
New-Item -Path "project\frontend\src\assets\styles" -ItemType Directory -Force | Out-Null
New-Item -Path "project\frontend\src\assets\images" -ItemType Directory -Force | Out-Null
New-Item -Path "project\frontend\src\components\common" -ItemType Directory -Force | Out-Null
New-Item -Path "project\frontend\src\components\auth" -ItemType Directory -Force | Out-Null
New-Item -Path "project\frontend\src\components\profile" -ItemType Directory -Force | Out-Null
New-Item -Path "project\frontend\src\components\network" -ItemType Directory -Force | Out-Null
New-Item -Path "project\frontend\src\components\feed" -ItemType Directory -Force | Out-Null
New-Item -Path "project\frontend\src\components\jobs" -ItemType Directory -Force | Out-Null
New-Item -Path "project\frontend\src\contexts" -ItemType Directory -Force | Out-Null
New-Item -Path "project\frontend\src\pages" -ItemType Directory -Force | Out-Null
New-Item -Path "project\frontend\src\services" -ItemType Directory -Force | Out-Null
New-Item -Path "project\frontend\src\utils" -ItemType Directory -Force | Out-Null

# Frontend dosyalarını oluştur
New-Item -Path "project\frontend\public\index.html" -ItemType File -Force | Out-Null
New-Item -Path "project\frontend\public\favicon.ico" -ItemType File -Force | Out-Null
New-Item -Path "project\frontend\src\App.js" -ItemType File -Force | Out-Null
New-Item -Path "project\frontend\src\index.js" -ItemType File -Force | Out-Null

# Frontend component dosyalarını oluştur
$frontendFiles = @{
    "components\common" = "Header.js", "Footer.js", "Sidebar.js", "NotificationPanel.js"
    "components\auth" = "Login.js", "Register.js", "PasswordReset.js"
    "components\profile" = "ProfileView.js", "ProfileEdit.js", "ExperienceSection.js", "EducationSection.js", "SkillsSection.js"
    "components\network" = "ConnectionList.js", "ConnectionRequests.js", "ConnectionSuggestions.js"
    "components\feed" = "NewPost.js", "PostList.js", "PostItem.js", "CommentSection.js"
    "components\jobs" = "JobListing.js", "JobSearch.js", "SavedJobs.js"
    "contexts" = "AuthContext.js", "NotificationContext.js", "ThemeContext.js"
    "pages" = "Home.js", "Auth.js", "Profile.js", "Network.js", "Jobs.js", "Notifications.js", "SinglePost.js"
    "services" = "api.js", "auth.js", "user.js", "profile.js", "connection.js", "post.js", "notification.js", "job.js"
    "utils" = "constants.js", "helpers.js", "validation.js"
}

foreach ($folder in $frontendFiles.Keys) {
    foreach ($file in $frontendFiles[$folder]) {
        New-Item -Path "project\frontend\src\$folder\$file" -ItemType File -Force | Out-Null
    }
}

New-Item -Path "project\frontend\package.json" -ItemType File -Force | Out-Null
New-Item -Path "project\frontend\README.md" -ItemType File -Force | Out-Null

# Backend yapısını oluştur
New-Item -Path "project\backend\app" -ItemType Directory -Force | Out-Null
New-Item -Path "project\backend\app\controller" -ItemType Directory -Force | Out-Null
New-Item -Path "project\backend\app\model" -ItemType Directory -Force | Out-Null
New-Item -Path "project\backend\app\service" -ItemType Directory -Force | Out-Null
New-Item -Path "project\backend\app\schema" -ItemType Directory -Force | Out-Null
New-Item -Path "project\backend\app\utils" -ItemType Directory -Force | Out-Null

# Backend dosyalarını oluştur
New-Item -Path "project\backend\app\__init__.py" -ItemType File -Force | Out-Null
New-Item -Path "project\backend\app\main.py" -ItemType File -Force | Out-Null
New-Item -Path "project\backend\app\config.py" -ItemType File -Force | Out-Null
New-Item -Path "project\backend\app\database.py" -ItemType File -Force | Out-Null

# Backend modül dosyalarını oluştur
$backendModules = @("controller", "model", "service", "schema")
$backendFiles = @("__init__.py", "auth.py", "user.py", "profile.py", "connection.py", "post.py", "notification.py", "job.py")

foreach ($module in $backendModules) {
    foreach ($file in $backendFiles) {
        New-Item -Path "project\backend\app\$module\$file" -ItemType File -Force | Out-Null
    }
}

# Backend utils dosyalarını oluştur
New-Item -Path "project\backend\app\utils\__init__.py" -ItemType File -Force | Out-Null
New-Item -Path "project\backend\app\utils\email.py" -ItemType File -Force | Out-Null
New-Item -Path "project\backend\app\utils\security.py" -ItemType File -Force | Out-Null
New-Item -Path "project\backend\app\utils\helpers.py" -ItemType File -Force | Out-Null

New-Item -Path "project\backend\requirements.txt" -ItemType File -Force | Out-Null
New-Item -Path "project\backend\README.md" -ItemType File -Force | Out-Null

Write-Host "Proje yapısı başarıyla oluşturuldu!" -ForegroundColor Green