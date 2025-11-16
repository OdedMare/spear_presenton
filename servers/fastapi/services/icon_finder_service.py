import asyncio
import json
from typing import List, Optional

import chromadb
from chromadb.config import Settings
from chromadb.utils.embedding_functions import ONNXMiniLM_L6_V2


class IconFinderService:
    def __init__(self):
        self.collection_name = "icons"
        self.client: Optional[chromadb.PersistentClient] = None
        self.collection = None
        self.embedding_function: Optional[ONNXMiniLM_L6_V2] = None
        self._init_lock = asyncio.Lock()

    def _load_icon_seed(self) -> list[dict]:
        try:
            with open("assets/icons.json", "r") as f:
                payload = json.load(f)
                return payload.get("icons", [])
        except FileNotFoundError as exc:
            print("Warning: Icon metadata file missing, continuing without it:", exc)
        except Exception as exc:
            print("Warning: Failed to load icon metadata, continuing without it:", exc)
        return []

    def _ensure_client(self) -> bool:
        if self.client:
            return True
        try:
            self.client = chromadb.PersistentClient(
                path="chroma", settings=Settings(anonymized_telemetry=False)
            )
            return True
        except Exception as exc:
            print("Warning: Unable to initialize Chroma client, continuing without it:", exc)
            return False

    def _ensure_embedding_function(self) -> bool:
        if self.embedding_function:
            return True
        try:
            embedding = ONNXMiniLM_L6_V2()
            embedding.DOWNLOAD_PATH = "chroma/models"
            embedding._download_model_if_not_exists()
            self.embedding_function = embedding
            return True
        except Exception as exc:
            print("Warning: Unable to download icon embeddings, continuing without them:", exc)
            return False

    def _initialize_icons_collection(self) -> bool:
        if not self._ensure_client():
            return False
        if not self._ensure_embedding_function():
            return False

        try:
            self.collection = self.client.get_collection(
                self.collection_name, embedding_function=self.embedding_function
            )
            return True
        except Exception:
            pass

        icons = self._load_icon_seed()
        documents: List[str] = []
        ids: List[str] = []
        for each in icons:
            try:
                if each["name"].split("-")[-1] != "bold":
                    continue
                doc_text = f"{each['name']} {each.get('tags', '')}"
                documents.append(doc_text)
                ids.append(each["name"])
            except Exception:
                continue

        if not documents:
            return False

        try:
            self.collection = self.client.create_collection(
                name=self.collection_name,
                embedding_function=self.embedding_function,
                metadata={"hnsw:space": "cosine"},
            )
            self.collection.add(documents=documents, ids=ids)
            return True
        except Exception as exc:
            print("Warning: Unable to seed icons collection, continuing without it:", exc)
            self.collection = None
            return False

    async def _ensure_collection_initialized(self) -> bool:
        if self.collection:
            return True
        async with self._init_lock:
            if self.collection:
                return True
            print("Initializing icons collection...")
            initialized = await asyncio.to_thread(self._initialize_icons_collection)
            if initialized:
                print("Icons collection initialized.")
            else:
                print("Warning: Icons collection unavailable, continuing without it")
            return bool(initialized and self.collection)

    async def search_icons(self, query: str, k: int = 1):
        if not await self._ensure_collection_initialized():
            return []
        try:
            result = await asyncio.to_thread(
                self.collection.query,
                query_texts=[query],
                n_results=k,
            )
            ids = result.get("ids", [[]])[0]
            return [f"/static/icons/bold/{each}.svg" for each in ids]
        except Exception as exc:
            print("Warning: Icon search failed, continuing without results:", exc)
            return []


ICON_FINDER_SERVICE = IconFinderService()
