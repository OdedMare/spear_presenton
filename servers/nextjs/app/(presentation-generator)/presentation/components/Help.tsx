import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { HelpCircle, X, Search } from "lucide-react";
import React, { useState, useEffect, useRef } from "react";

const helpQuestions = [
  {
    id: 1,
    category: "תמונות",
    question: "כיצד אוכל לשנות תמונה?",
    answer:
      "לחץ על כל תמונה כדי לחשוף את סרגל הכלים של התמונה. תראה אפשרויות לערוך, להתאים מיקום ולשנות את אופן התאמת התמונה בתוך המיכל שלה. אפשרות העריכה מאפשרת לך להחליף או לשנות את התמונה הנוכחית.",
  },
  {
    id: 2,
    category: "תמונות",
    question: "האם אוכל ליצור תמונות חדשות באמצעות בינה מלאכותית?",
    answer:
      "כן! לחץ על כל תמונה ובחר באפשרות 'ערוך' מסרגל הכלים. בחלונית הצדדית שתופיע, תמצא את לשונית 'יצירת AI'. הזן את ההנחיה שלך המתארת את התמונה שאתה רוצה, והבינה המלאכותית שלנו תיצור תמונה בהתאם לתיאור שלך.",
  },
  {
    id: 3,
    category: "תמונות",
    question: "כיצד אוכל להעלות תמונות משלי?",
    answer:
      "לחץ על כל תמונה, ולאחר מכן בחר 'ערוך' מסרגל הכלים. בחלונית הצדדית, לחץ על לשונית 'העלאה' למעלה. תוכל לדפדף בקבצים שלך כדי לבחור אחד. לאחר ההעלאה, תוכל להחיל אותו על העיצוב שלך.",
  },
  {
    id: 11,
    category: "הנחיות AI",
    question: "האם אוכל לשנות את פריסת השקופית באמצעות הנחיה?",
    answer:
      "כן, אתה יכול! לחץ על אייקון WandSparkles בפינה השמאלית העליונה של כל שקופית ויופיע לך תיבת קלט להנחיה. תאר את דרישות הפריסה שלך והבינה המלאכותית תשנה את פריסת השקופית בהתאם.",
  },
  {
    id: 12,
    category: "הנחיות AI",
    question: "האם אוכל לשנות את תמונת השקופית באמצעות הנחיה?",
    answer:
      "כן, אתה יכול! לחץ על אייקון WandSparkles בפינה השמאלית העליונה של כל שקופית ויופיע לך תיבת קלט להנחיה. תאר את התמונה שאתה רוצה והבינה המלאכותית תעדכן את תמונת השקופית בהתאם לדרישותיך.",
  },

  {
    id: 14,
    category: "הנחיות AI",
    question: "האם אוכל לשנות תוכן באמצעות הנחיה?",
    answer:
      "כן, אתה יכול! לחץ על אייקון WandSparkles בפינה השמאלית העליונה של כל שקופית ויופיע לך תיבת קלט להנחיה. תאר איזה תוכן אתה רוצה והבינה המלאכותית תעדכן את הטקסט והתוכן של השקופית בהתאם לתיאור שלך.",
  },
  {
    id: 4,
    category: "טקסט",
    question: "כיצד אוכל לעצב ולהדגיש טקסט?",
    answer:
      "בחר כל טקסט כדי שסרגל הכלים לעיצוב יופיע. יהיו לך אפשרויות להדגשה, הטיה, קו תחתון, קו חוצה ועוד.",
  },
  {
    id: 5,
    category: "אייקונים",
    question: "כיצד אוכל לשנות אייקונים?",
    answer:
      "לחץ על כל אייקון קיים כדי לשנות אותו. בחלונית בורר האייקונים, תוכל לדפדף באייקונים או להשתמש בפונקציית החיפוש כדי למצוא אייקונים ספציפיים. אנו מציעים אלפי אייקונים במגוון סגנונות.",
  },
  {
    id: 16,
    category: "פריסה",
    question: "האם אוכל לשנות את מיקום השקופית?",
    answer: "כמובן, בחלונית הצדדית תוכל לגרור את השקופית ולמקם אותה היכן שתרצה.",
  },
  {
    id: 15,
    category: "פריסה",
    question: "האם אוכל להוסיף שקופית חדשה בין שקופיות?",
    answer:
      "כן, אתה יכול פשוט ללחוץ על אייקון הפלוס מתחת לכל שקופית. הוא יציג את כל הפריסות ותוכל לבחור את הפריסה הנדרשת.",
  },
  {
    id: 6,
    category: "פריסה",
    question: "האם אוכל להוסיף עוד חלקים לשקופיות שלי?",
    answer:
      "בהחלט! רחף ליד החלק התחתון של כל תיבת טקסט או בלוק תוכן, ותראה אייקון + מופיע. לחץ על כפתור זה כדי להוסיף חלק חדש מתחת לנוכחי. תוכל גם להשתמש בתפריט 'הוספה' כדי להוסיף סוגי חלקים ספציפיים.",
  },

  {
    id: 8,
    category: "ייצוא",
    question: "כיצד אוכל להוריד או לייצא את המצגת שלי?",
    answer:
      "לחץ על כפתור 'ייצוא' בתפריט הימני העליון. תוכל לבחור להוריד כקובץ PDF, PowerPoint.",
  },
];

const Help = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredQuestions, setFilteredQuestions] = useState(helpQuestions);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("הכל");
  const modalRef = useRef<HTMLDivElement>(null);

  // Extract unique categories and create "All" category list
  useEffect(() => {
    const uniqueCategories = Array.from(
      new Set(helpQuestions.map((q) => q.category))
    );
    setCategories(["הכל", ...uniqueCategories]);
  }, []);

  // Filter questions based on search query and selected category
  useEffect(() => {
    let results = helpQuestions;

    // Filter by category if not "All"
    if (selectedCategory !== "הכל") {
      results = results.filter((q) => q.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      results = results.filter(
        (q) =>
          q.question.toLowerCase().includes(query) ||
          q.answer.toLowerCase().includes(query)
      );
    }

    setFilteredQuestions(results);
  }, [searchQuery, selectedCategory]);

  // Close modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node) &&
        !(event.target as HTMLElement).closest(".help-button")
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleOpenClose = () => {
    setIsOpen(!isOpen);
  };

  // Animation helpers
  const modalClass = isOpen
    ? "opacity-100 scale-100"
    : "opacity-0 scale-95 pointer-events-none";

  return (
    <>
      {/* Help Button */}
      <button
        onClick={handleOpenClose}
        className="help-button hidden fixed bottom-6 right-6 h-12 w-12 z-50 bg-emerald-600 hover:bg-emerald-700 rounded-full md:flex justify-center items-center cursor-pointer shadow-lg transition-all duration-300 hover:shadow-xl"
        aria-label="מרכז עזרה"
      >
        {isOpen ? (
          <X className="text-white h-5 w-5" />
        ) : (
          <HelpCircle className="text-white h-5 w-5" />
        )}
      </button>

      {/* Help Modal */}
      <div
        className={`fixed bottom-20 right-6 z-50 max-w-md w-full transition-all duration-300 transform ${modalClass}`}
        ref={modalRef}
      >
        <div className="bg-white rounded-lg shadow-2xl border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="bg-emerald-600 text-white px-6 py-4 flex justify-between items-center">
            <h2 className="text-lg font-medium">מרכז עזרה</h2>
            <button
              onClick={() => setIsOpen(false)}
              className="hover:bg-emerald-700 p-1 rounded"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Search */}
          <div className="px-6 pt-4 pb-2">
            <div className="relative">
              <input
                type="text"
                placeholder="חפש נושאי עזרה..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            </div>
          </div>

          {/* Category Pills */}
          <div className="px-6 pb-3 flex gap-2 overflow-x-auto hide-scrollbar">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-3 py-1 rounded-full text-sm whitespace-nowrap ${selectedCategory === category
                  ? "bg-emerald-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
              >
                {category}
              </button>
            ))}
          </div>

          {/* FAQ Accordion */}
          <div className="max-h-96 overflow-y-auto px-6 pb-6">
            {filteredQuestions.length > 0 ? (
              <Accordion type="single" collapsible className="w-full">
                {filteredQuestions.map((faq, index) => (
                  <AccordionItem
                    key={index}
                    value={`item-${index}`}
                    className="border-b border-gray-200 last:border-b-0"
                  >
                    <AccordionTrigger className="hover:no-underline py-3 px-1 text-left flex">
                      <div className="flex-1 pr-2">
                        <span className="text-gray-900 font-medium text-sm md:text-base">
                          {faq.question}
                        </span>
                        <span className="block text-xs text-emerald-600 mt-0.5">
                          {faq.category}
                        </span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-1 pb-3">
                      <div className="text-sm text-gray-600 leading-relaxed rounded bg-gray-50 p-3">
                        {faq.answer}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            ) : (
              <div className="py-8 text-center text-gray-500">
                <p>לא נמצאו תוצאות עבור "{searchQuery}"</p>
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedCategory("הכל");
                  }}
                  className="mt-2 text-emerald-600 hover:underline text-sm"
                >
                  נקה חיפוש
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Help;
