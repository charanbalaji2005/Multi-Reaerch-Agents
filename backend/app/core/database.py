from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings

client: AsyncIOMotorClient = None
db = None


async def connect_db():
    global client, db
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    db = client[settings.MONGODB_DB_NAME]

    # Create indexes
    await db.users.create_index("email", unique=True)
    await db.research_projects.create_index("user_id")
    await db.research_projects.create_index("created_at")
    await db.agent_logs.create_index("project_id")
    await db.reports.create_index("project_id")

    print(f"Connected to MongoDB: {settings.MONGODB_DB_NAME}")


async def close_db():
    global client
    if client:
        client.close()
        print("MongoDB connection closed")


def get_db():
    return db
