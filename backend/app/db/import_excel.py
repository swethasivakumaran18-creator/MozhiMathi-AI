import os
import sys
import pandas as pd
from sqlalchemy.orm import Session

# Append parent dir to python path to import app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from app.db.session import SessionLocal, engine
from app.db.base import Base
from app.models.terminology import Domain, Category, Source, Term, Definition, Example, Synonym

def clean_val(val):
    if pd.isna(val) or val is None:
        return None
    s = str(val).strip()
    return s if s else None

def import_dataset():
    # Make sure all DB tables exist
    print("Initializing database schemas...")
    Base.metadata.create_all(bind=engine)
    
    excel_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))), "dataset.xlsx")
    if not os.path.exists(excel_path):
        print(f"Excel dataset not found at {excel_path}")
        return
        
    print(f"Loading Excel file: {excel_path} (Sheet: 'Combined Master')...")
    try:
        df = pd.read_excel(excel_path, sheet_name="Combined Master")
    except Exception as e:
        print(f"Failed to read sheet 'Combined Master': {e}")
        return
        
    row_count = len(df)
    print(f"Successfully loaded {row_count} rows from Excel.")
    
    db: Session = SessionLocal()
    
    # Pre-fetch existing domains, categories, and sources to minimize DB queries
    domains_cache = {d.name.lower(): d.id for d in db.query(Domain).all()}
    categories_cache = {c.name.lower(): c.id for c in db.query(Category).all()}
    sources_cache = {s.name.lower(): s.id for s in db.query(Source).all()}
    
    # Pre-fetch existing terms to prevent duplicates
    existing_terms = {t.english_term.lower().strip() for t in db.query(Term.english_term).all()}
    
    print(f"Pre-loaded caches: {len(domains_cache)} domains, {len(categories_cache)} categories, {len(sources_cache)} sources, {len(existing_terms)} existing terms.")
    
    imported_terms = 0
    skipped_terms = 0
    batch_size = 500
    
    try:
        for idx, row in df.iterrows():
            eng_raw = clean_val(row.get("English Term"))
            tam_raw = clean_val(row.get("Tamil Term"))
            pure_raw = clean_val(row.get("Pure Tamil"))
            
            # Map based on column occupancy
            if eng_raw:
                eng = eng_raw
                tam = tam_raw if tam_raw else eng_raw
                pure = pure_raw if pure_raw else tam
            elif tam_raw:
                eng = tam_raw
                tam = tam_raw
                pure = pure_raw if pure_raw else tam_raw
            else:
                skipped_terms += 1
                continue
                
            # Skip duplicates
            if eng.lower().strip() in existing_terms:
                skipped_terms += 1
                continue
                
            # Resolve or create Domain
            dom_name = clean_val(row.get("Domain")) or "Software Engineering"
            dom_key = dom_name.lower()
            if dom_key not in domains_cache:
                new_dom = Domain(name=dom_name, description=f"Technical terms in {dom_name}.")
                db.add(new_dom)
                db.flush()
                domains_cache[dom_key] = new_dom.id
            dom_id = domains_cache[dom_key]
            
            # Resolve or create Category
            cat_name = clean_val(row.get("Category")) or "Programming Concepts"
            cat_key = cat_name.lower()
            if cat_key not in categories_cache:
                new_cat = Category(name=cat_name, description=f"Vocabulary for {cat_name}.")
                db.add(new_cat)
                db.flush()
                categories_cache[cat_key] = new_cat.id
            cat_id = categories_cache[cat_key]
            
            # Resolve or create Source
            src_name = clean_val(row.get("Source")) or "Community Proposed"
            src_key = src_name.lower()
            if src_key not in sources_cache:
                new_src = Source(name=src_name, url=None, description=f"Terms provided by {src_name}.")
                db.add(new_src)
                db.flush()
                sources_cache[src_key] = new_src.id
            src_id = sources_cache[src_key]
            
            # Official status
            status_val = clean_val(row.get("Official Status"))
            is_verified = True
            if status_val and "unverified" in status_val.lower():
                is_verified = False
                
            # Confidence score
            try:
                conf = float(row.get("Confidence")) if pd.notna(row.get("Confidence")) else 1.0
            except:
                conf = 1.0
                
            # Create Term
            term_obj = Term(
                english_term=eng,
                tamil_term=tam,
                pure_tamil_term=pure,
                domain_id=dom_id,
                category_id=cat_id,
                source_id=src_id,
                confidence_score=conf,
                is_verified=is_verified
            )
            
            db.add(term_obj)
            db.flush() # Get term_obj.id
            
            # Add definition if present
            defn_text = clean_val(row.get("Definition"))
            if defn_text:
                defn = Definition(
                    term_id=term_obj.id,
                    tamil_definition=defn_text,
                    english_definition=None
                )
                db.add(defn)
                
            # Add example if present
            ex_text = clean_val(row.get("Examples"))
            if ex_text:
                ex = Example(
                    term_id=term_obj.id,
                    tamil_example=ex_text,
                    english_example=None
                )
                db.add(ex)
                
            # Add synonym if present
            syn_text = clean_val(row.get("Synonyms"))
            if syn_text:
                syn = Synonym(
                    term_id=term_obj.id,
                    synonym_term=syn_text,
                    language="ta"
                )
                db.add(syn)
                
            imported_terms += 1
            existing_terms.add(eng.lower().strip())
            
            if imported_terms % batch_size == 0:
                db.commit()
                print(f"Imported {imported_terms} terms... (Processed row {idx + 1}/{row_count})")
                
        # Final commit
        db.commit()
        print(f"Import complete! Total technical terms imported: {imported_terms}, skipped: {skipped_terms}")
        
    except Exception as e:
        db.rollback()
        print(f"Error during bulk import transaction: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    import_dataset()
