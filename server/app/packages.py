from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
import hashlib
import json

class PackageCompatibilityManifest(BaseModel):
    min_os_version: str = "4.0.0"
    supports_health_context: bool = True
    supports_spatial_tier: str = "tierC_Fallback"

class ChefPackage(BaseModel):
    """
    V4 Rule: Replaces raw tokenized weights with safe, moderated, and version-pinned artifacts.
    """
    package_id: str
    creator_id: str
    display_name: str
    cuisine_scope: str
    style_policy: str = Field(description="Strict textual bounds for LLM persona behavior")
    allowed_flavor_profile_vectors: List[str]
    nutrition_bias_profile: str
    moderation_status: str = Field(default="PENDING_REVIEW", description="Must be APPROVED before distribution")
    compatibility_manifest: PackageCompatibilityManifest
    provenance_signature: Optional[str] = None

class ChefPackageCompiler:
    @staticmethod
    def compile_package(creator_id: str, name: str, style: str, flavors: List[str]) -> ChefPackage:
        pkg = ChefPackage(
            package_id=f"pkg_{int(datetime.now().timestamp())}",
            creator_id=creator_id,
            display_name=name,
            cuisine_scope="Automatic",
            style_policy=style,
            allowed_flavor_profile_vectors=flavors,
            nutrition_bias_profile="neutral",
            compatibility_manifest=PackageCompatibilityManifest()
        )
        return pkg

class ProvenanceSigner:
    @staticmethod
    def sign_package(package: ChefPackage, private_key: str) -> ChefPackage:
        # V4 Rule: All distributed packages must be version-pinned and provenance-signed.
        hasher = hashlib.sha256()
        canonical_str = json.dumps(package.dict(exclude={'provenance_signature'}), sort_keys=True)
        hasher.update(f"{canonical_str}{private_key}".encode('utf-8'))
        package.provenance_signature = hasher.hexdigest()
        return package

class AbuseModerationQueue:
    @staticmethod
    def review_package(package: ChefPackage) -> bool:
        # V4 Rule: Private family memory cannot leak. Must scan for PII/Abuse.
        unsafe_keywords = ["medical_claim", "cure", "toxin", "poison", "address", "phone"]
        for word in unsafe_keywords:
            if word in package.style_policy.lower():
                package.moderation_status = "REJECTED_UNSAFE_CLAIMS"
                return False
        
        package.moderation_status = "APPROVED"
        return True
