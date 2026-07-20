from sqlalchemy.orm import Session
from app.db.session import SessionLocal, engine
from app.db.base import Base
from app.models.terminology import Domain, Category, Source, Term, Definition, Example, Synonym
from app.core.logging import logger

def seed_db():
    # Make sure tables are created
    Base.metadata.create_all(bind=engine)
    
    db: Session = SessionLocal()
    try:
        # Check if domains already exist, if so, we don't need to re-seed
        if db.query(Domain).first():
            logger.info("Database already seeded with terminology.")
            return

        logger.info("Seeding database with pure Tamil technical terminology...")

        # 1. Create Domains
        software_eng = Domain(name="Software Engineering", description="Core concepts in software engineering and application development.")
        data_science = Domain(name="Data Science", description="Terminology in artificial intelligence, machine learning, and data analytics.")
        networking = Domain(name="Computer Networks", description="Internet, routing, and communication system protocols.")
        sys_admin = Domain(name="System Administration", description="Hardware, operating systems, and server management.")
        db.add_all([software_eng, data_science, networking, sys_admin])
        db.flush()

        # 2. Create Categories
        programming = Category(name="Programming Concepts", description="Terms related to coding, syntax, and logic.")
        data_struct = Category(name="Data Structures", description="Containers and schemas used to store and manipulate data.")
        architecture = Category(name="System Architecture", description="Design frameworks, design patterns, and platform structures.")
        slang_loan = Category(name="Colloquial Loan Words", description="Sanskritized or common colloquial slangs to be mapped to pure Tamil.")
        db.add_all([programming, data_struct, architecture, slang_loan])
        db.flush()

        # 3. Create Sources
        anna_univ = Source(name="Anna University Glossary", url="https://www.annauniv.edu", description="Standard technical vocabulary curated by Anna University.")
        uom = Source(name="University of Madras", url="https://www.unom.ac.in", description="Classic linguistic database for Tamil dictionary equivalents.")
        community = Source(name="Community Proposed", url=None, description="Terms suggested by open-source Tamil developers and tech-writers.")
        db.add_all([anna_univ, uom, community])
        db.flush()

        # 4. Create Terms
        terms_data = [
            # Technical Software Terms
            {
                "english": "API",
                "tamil": "ஏபிஐ",
                "pure": "நெறிமுறை இடைமுகம்",
                "ipa": "eɪ-pi-aɪ",
                "domain": software_eng,
                "category": architecture,
                "source": anna_univ,
                "confidence": 0.98,
                "definitions": [
                    {
                        "tamil_definition": "செயலவி நிரலாக்க இடைமுகம்; மென்பொருள் கூறுகள் ஒன்றோடொன்று தொடர்பு கொள்ளும் நெறிமுறைகளின் தொகுப்பு.",
                        "english_definition": "Application Programming Interface; a set of protocols for building and integrating application software."
                    }
                ],
                "examples": [
                    {
                        "tamil_example": "புதிய நெறிமுறை இடைமுகம் (API) தரவுகளை விரைவாக பரிமாறுகிறது.",
                        "english_example": "The new API transfers data quickly."
                    }
                ]
            },
            {
                "english": "Variable",
                "tamil": "வேரியபிள்",
                "pure": "மாறி",
                "ipa": "væriəbl",
                "domain": software_eng,
                "category": programming,
                "source": anna_univ,
                "confidence": 1.00,
                "definitions": [
                    {
                        "tamil_definition": "நிரலாக்கத்தில் ஒரு மதிப்பைச் சேமித்து வைக்கும் தற்காலிக நினைவக இடம்.",
                        "english_definition": "A temporary storage location in programming that holds a value that can change."
                    }
                ],
                "examples": [
                    {
                        "tamil_example": "மதிப்பைச் சேமிக்க ஒரு மாறியை (Variable) உருவாக்குங்கள்.",
                        "english_example": "Create a variable to store the value."
                    }
                ]
            },
            {
                "english": "Algorithm",
                "tamil": "அல்காரிதம்",
                "pure": "நெறிமுறை",
                "ipa": "ælɡərɪðəm",
                "domain": software_eng,
                "category": programming,
                "source": anna_univ,
                "confidence": 0.95,
                "definitions": [
                    {
                        "tamil_definition": "ஒரு சிக்கலைத் தீர்ப்பதற்கான படிநிலைக் கட்டளைகளின் ஒழுங்குமுறைத் தொகுப்பு.",
                        "english_definition": "A step-by-step procedure or set of rules for solving a problem."
                    }
                ],
                "examples": [
                    {
                        "tamil_example": "இந்த நெறிமுறை (Algorithm) தேடல் வேகத்தை அதிகரிக்கிறது.",
                        "english_example": "This algorithm increases search speed."
                    }
                ]
            },
            {
                "english": "Database",
                "tamil": "டேட்டாபேஸ்",
                "pure": "தரவுத்தளம்",
                "ipa": "deɪtəbeɪs",
                "domain": software_eng,
                "category": data_struct,
                "source": anna_univ,
                "confidence": 1.00,
                "definitions": [
                    {
                        "tamil_definition": "தரவுகளை முறையாகச் சேமித்து, எளிதாக அணுக உதவும் கணினி அமைப்பு.",
                        "english_definition": "An organized collection of data stored and accessed electronically."
                    }
                ],
                "examples": [
                    {
                        "tamil_example": "பயனர் விவரங்கள் அனைத்தும் தரவுத்தளத்தில் (Database) சேமிக்கப்படுகின்றன.",
                        "english_example": "All user details are stored in the database."
                    }
                ]
            },
            {
                "english": "Compiler",
                "tamil": "கம்பைலர்",
                "pure": "நிரல்பெயர்ப்பி",
                "ipa": "kəmˈpaɪlər",
                "domain": software_eng,
                "category": programming,
                "source": anna_univ,
                "confidence": 0.97,
                "definitions": [
                    {
                        "tamil_definition": "உயர்நிலை நிரலாக்க மொழியை கணினி புரிந்து கொள்ளும் இயந்திர மொழியாக மாற்றும் மென்பொருள்.",
                        "english_definition": "A program that translates high-level programming code into machine language."
                    }
                ],
                "examples": [
                    {
                        "tamil_example": "நிரல்பெயர்ப்பி (Compiler) குறியீட்டில் உள்ள பிழைகளைச் சுட்டிக்காட்டுகிறது.",
                        "english_example": "The compiler points out errors in the code."
                    }
                ]
            },
            {
                "english": "Loop",
                "tamil": "லூப்",
                "pure": "மடக்கு",
                "ipa": "luːp",
                "domain": software_eng,
                "category": programming,
                "source": community,
                "confidence": 0.92,
                "definitions": [
                    {
                        "tamil_definition": "குறிப்பிட்ட நிபந்தனை முடியும் வரை ஒரு குறியீட்டுத் தொகுதியை மீண்டும் மீண்டும் இயக்கும் கட்டளை.",
                        "english_definition": "A sequence of instructions that is continually repeated until a certain condition is reached."
                    }
                ],
                "examples": [
                    {
                        "tamil_example": "தரவுகளை ஒவ்வொன்றாக அச்சிட மடக்கு (Loop) பயன்படுத்தப்படுகிறது.",
                        "english_example": "A loop is used to print data items one by one."
                    }
                ]
            },
            {
                "english": "Server",
                "tamil": "சர்வர்",
                "pure": "வழங்கி",
                "ipa": "ˈsɜːrvər",
                "domain": networking,
                "category": architecture,
                "source": anna_univ,
                "confidence": 0.99,
                "definitions": [
                    {
                        "tamil_definition": "வலையமைப்பில் உள்ள பிற கணினிகளுக்குச் சேவைகள் அல்லது கோப்புகளை வழங்கும் கணினி.",
                        "english_definition": "A computer or system that provides resources, data, services, or programs to other computers."
                    }
                ],
                "examples": [
                    {
                        "tamil_example": "வழங்கி (Server) கோரிக்கைகளுக்கு விரைவாகப் பதிலளிக்கிறது.",
                        "english_example": "The server responds quickly to requests."
                    }
                ]
            },
            {
                "english": "Client",
                "tamil": "கிளையண்ட்",
                "pure": "வாடிக்கையி",
                "ipa": "ˈklaɪənt",
                "domain": networking,
                "category": architecture,
                "source": community,
                "confidence": 0.90,
                "definitions": [
                    {
                        "tamil_definition": "வழங்கியிடம் இருந்து சேவைகளைப் பெற்று பயன்படுத்தும் முனையம் அல்லது செயலி.",
                        "english_definition": "A desktop, application, or system that requests services from a server."
                    }
                ],
                "examples": [
                    {
                        "tamil_example": "வாடிக்கையி (Client) வழங்கியோடு வெற்றிகரமாக இணைக்கப்பட்டது.",
                        "english_example": "The client successfully connected to the server."
                    }
                ]
            },
            # Sanskritized & Colloquial Words
            {
                "english": "Ego",
                "tamil": "அகங்காரம்",
                "pure": "இறுமாப்பு",
                "ipa": "ʌkʌŋɡɑːrʌm",
                "domain": None,
                "category": slang_loan,
                "source": uom,
                "confidence": 0.95,
                "definitions": [
                    {
                        "tamil_definition": "தற்பெருமை, தலைக்கனம் அல்லது ஆணவம்; வடமொழிச் சொல்லான அகங்காரத்திற்கு இணையான தூய தமிழ் மாற்று.",
                        "english_definition": "Excessive self-pride, arrogance, or vanity. Pure Tamil alternative to the Sanskritized 'Akankaram'."
                    }
                ],
                "examples": [
                    {
                        "tamil_example": "இறுமாப்பு (இறுமாப்பு) மனிதனின் வீழ்ச்சிக்கு வழிவகுக்கும்.",
                        "english_example": "Ego leads to a person's downfall."
                    }
                ]
            },
            {
                "english": "Circumambulation",
                "tamil": "பிரதட்சனம்",
                "pure": "வலம் வருதல்",
                "ipa": "prʌðʌtɕɪnʌm",
                "domain": None,
                "category": slang_loan,
                "source": uom,
                "confidence": 0.97,
                "definitions": [
                    {
                        "tamil_definition": "கோவிலில் சன்னதியைச் சுற்றி வலப்பக்கமாக வருதல்; பிரதட்சனம் என்பதன் தூய தமிழ் மாற்று.",
                        "english_definition": "Walking around a sacred object or temple sanctuary clockwise."
                    }
                ],
                "examples": [
                    {
                        "tamil_example": "பக்தர்கள் கோயிலை வலம் வருதல் (பிரதட்சனம்) செய்கிறார்கள்.",
                        "english_example": "Devotees circumambulate the temple."
                    }
                ]
            },
            {
                "english": "Anointment",
                "tamil": "அபிஷேகம்",
                "pure": "திருமுழுக்கு",
                "ipa": "ʌbɪʂeːkʌm",
                "domain": None,
                "category": slang_loan,
                "source": uom,
                "confidence": 0.96,
                "definitions": [
                    {
                        "tamil_definition": "புனித நீரால் அல்லது நறுமணப் பொருட்களால் இறைவனுக்குச் செய்யும் நீராட்டு; அபிஷேகம் என்பதன் தூய தமிழ் மாற்று.",
                        "english_definition": "The ceremonial act of pouring water or sacred liquid as an offering."
                    }
                ],
                "examples": [
                    {
                        "tamil_example": "கோயிலில் இறைவனுக்குச் சிறப்புத் திருமுழுக்கு (அபிஷேகம்) நடைபெற்றது.",
                        "english_example": "A special anointment ceremony was conducted for the deity."
                    }
                ]
            },
            {
                "english": "Blessing",
                "tamil": "ஆசீர்வாதம்",
                "pure": "நல்வாழ்த்து",
                "ipa": "ɑːsiːrvɑːðʌm",
                "domain": None,
                "category": slang_loan,
                "source": uom,
                "confidence": 0.99,
                "definitions": [
                    {
                        "tamil_definition": "பெரியவர்கள் இளையோரை நல்வழியில் வாழ்த்துதல்; ஆசீர்வாதம் என்பதன் தூய தமிழ் மாற்று.",
                        "english_definition": "Sanskritized loan word 'Aseervatham' replaced by pure Tamil 'Nalvaazhthu'."
                    }
                ],
                "examples": [
                    {
                        "tamil_example": "பெற்றோரின் நல்வாழ்த்து (ஆசீர்வாதம்) எப்போதுமே துணைநிற்கும்.",
                        "english_example": "Parents' blessings are always a support."
                    }
                ]
            }
        ]

        for t in terms_data:
            term_obj = Term(
                english_term=t["english"],
                tamil_term=t["tamil"],
                pure_tamil_term=t["pure"],
                ipa_tamil=t["ipa"],
                domain_id=t["domain"].id if t["domain"] else None,
                category_id=t["category"].id if t["category"] else None,
                source_id=t["source"].id if t["source"] else None,
                confidence_score=t["confidence"],
                is_verified=True
            )
            db.add(term_obj)
            db.flush()

            # Add definitions
            if "definitions" in t:
                for d in t["definitions"]:
                    defn = Definition(
                        term_id=term_obj.id,
                        tamil_definition=d["tamil_definition"],
                        english_definition=d["english_definition"]
                    )
                    db.add(defn)

            # Add examples
            if "examples" in t:
                for e in t["examples"]:
                    ex = Example(
                        term_id=term_obj.id,
                        tamil_example=e["tamil_example"],
                        english_example=e["english_example"]
                    )
                    db.add(ex)

        db.commit()
        logger.info("Successfully seeded database with beautiful, verified technical terms!")
    except Exception as e:
        db.rollback()
        logger.error(f"Error during seeding: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_db()
