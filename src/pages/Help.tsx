import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Info, Mail, ChevronDown, ChevronUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";


type HelpProps = {
  role: "customer" | "cafe";
};

const Help = ({ role }: HelpProps) => {
  const navigate = useNavigate();
  const [openFAQ, setOpenFAQ] = useState<number | null>(null);

  const customerFAQs = [
    {
      question: "How do I earn points?",
      answer:
        "You earn points by visiting cafés, making purchases, and participating in events. Each visit can add points to your CafeHop wallet.",
    },
    {
      question: "How do I redeem rewards?",
      answer:
        "Redeem rewards by going to the Rewards tab, selecting a reward, and confirming redemption at the café. Points will be deducted from your balance.",
    },
    {
      question: "Troubleshooting & support",
      answer:
        "If you encounter issues, try restarting the app or checking your internet connection. For further help, contact support.",
    },
    {
      question: "Can I transfer points to friends?",
      answer:
        "Currently, points cannot be transferred to other users, but you can redeem rewards for friends at participating cafés.",
    },
    {
      question: "How do I update my account info?",
      answer:
        "Go to the Settings tab and select Edit Profile. You can update your name, email, and cafe preferences there.",
    },
    {
      question: "What if I lose my phone?",
      answer:
        "Log in to your account on another device. Make sure you have two-factor authentication enabled for extra security.",
    },
  ];

  const cafeFAQs = [
    {
      question: "How do I update my cafe profile?",
      answer:
        "Go to Settings → Edit Profile. You can update your cafe name, description, profile picture, and offered amenities.",
    },
    {
      question: "How do I manage cafe offerings?",
      answer:
        "Within Edit Profile, toggle options like WiFi availability, quiet atmosphere, vegan or gluten-free offerings, seating types, and other amenities.",
    },
    {
      question: "Can I highlight special promotions?",
      answer:
        "Yes! You can update your cafe's 'About' section or contact support to feature promotions in the app.",
    },
    {
      question: "How do I respond to customer feedback?",
      answer:
        "Customer feedback will appear in your dashboard. Reply directly to messages or update your cafe info to address common requests.",
    },
    {
      question: "Troubleshooting & support",
      answer:
        "If you experience issues with your cafe profile or the app, try refreshing or checking your internet connection. Contact support for further assistance.",
    },
  ];

  const faqs = role === "cafe" ? cafeFAQs : customerFAQs;

  const toggleFAQ = (index: number) => {
    setOpenFAQ(openFAQ === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-background px-4">
      {/* Header */}
      <header className="flex items-center gap-3 py-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-xl hover:bg-muted transition"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-xl font-semibold">Help</h1>
      </header>

      <main className="max-w-lg mx-auto space-y-6">
        {/* FAQ */}
        <section>
          <p className="text-md font-semibold mb-2 ">Frequently Asked Questions</p>

          <div className="bg-card rounded-2xl border border-border overflow-hidden">
            {faqs.map((faq, index) => (
              <div key={index}>
                <button
                  onClick={() => toggleFAQ(index)}
                  className="w-full flex items-center justify-between p-4 border-b border-border hover:bg-muted transition"
                >
                  <div className="flex items-center gap-3">
                    <Info className="h-5 w-5 text-caramel" />
                    <p className="font-medium">{faq.question}</p>
                  </div>
                  {openFAQ === index ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>
                <AnimatePresence initial={false}>
                  {openFAQ === index && (
                    <motion.div
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="px-4 pt-2 pb-4 text-base text-muted-foreground"
                    >
                      {faq.answer}
                    </motion.div>

                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </section>

        {/* Contact */}
        <section>
          <p className="text-md font-semibold mb-2">Contact Us</p>

          <div className="bg-card rounded-2xl border border-border overflow-hidden">
            <Button
              variant="outline"
              className="w-full flex items-center gap-3 text-base font-semibold justify-center"
            >
              <Mail className="h-4 w-4" />
              Email Support
            </Button>
          </div>
        </section>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-center text-xs text-muted-foreground"
        >
          CafeHop v1.0.0
        </motion.p>
      </main>
    </div>
  );
};

export default Help;
