# Import essential models first
from app.model.user import User
from app.model.profile import Profile, Experience, Education, Skill, Endorsement

# Import other models as needed for the auth functionality
# Commenting out other imports to avoid circular dependencies while debugging
# from app.model.connection import Connection, Follow
# from app.model.post import Post, Comment, Like, CommentLike
# from app.model.notification import Notification
# from app.model.job import Job, JobApplication, SavedJob