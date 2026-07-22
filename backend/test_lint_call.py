import os
import sys
from dotenv import load_dotenv
from sqlalchemy.orm import Session

# Load environment variables
load_dotenv()

# Add backend to path so we can import app modules
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.db.session import SessionLocal
from app.schemas.linter import LintRequest
from app.services.linter import linter_service

def test_lint():
    db = SessionLocal()
    try:
        # A test sentence with Tanglish and technical words
        text = "Variable declare pannunga appuram server database connectivity configure pannunga."
        print(f"Linting text: '{text}'")
        
        req = LintRequest(text=text)
        response = linter_service.lint_text(db, req)
        
        print("\n--- LINTER RESPONSE ---")
        print(f"Detected Language: {response.language_info.detected_language} (Confidence: {response.language_info.confidence})")
        print(f"Contains Tanglish: {response.language_info.contains_tanglish}")
        print(f"Writing Score: {response.quality_metrics.writing_score}/100")
        print(f"Number of warnings: {len(response.warnings)}")
        
        for w in response.warnings:
            print(f"\nFlagged Word: '{w.original_term}'")
            print(f"  Suggested Pure Tamil: {w.suggested_pure_term}")
            print(f"  Phonetic Tamil: {w.phonetic_rendering}")
            print(f"  Is Verified: {w.is_verified}")
            print(f"  Explanation: {w.explanation}")
            
        print("\nSuggested Rewrite (Pure Tamil):")
        print(response.suggested_rewrite_pure)
        print("\nSuggested Rewrite (Phonetic Tamil):")
        print(response.suggested_rewrite_phonetic)
        
    except Exception as e:
        print("Error during linting:")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    test_lint()
