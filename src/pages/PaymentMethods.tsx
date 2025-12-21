import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, CreditCard, Plus, Wallet, Coffee, X, Server } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

type PaymentMethodsProps = {
  role: "customer" | "cafe";
};

interface Card {
  id: number;
  type: string;
  last4: string;
  expiry: string;
}

interface POS {
  id: number;
  name: string;
  connected: boolean;
}

const PaymentMethods = ({ role }: PaymentMethodsProps) => {
  const navigate = useNavigate();

  // Customer state
  const [paymentMethods, setPaymentMethods] = useState<Card[]>([
    { id: 1, type: "Visa", last4: "4242", expiry: "04/27" },
    { id: 2, type: "Mastercard", last4: "8891", expiry: "11/26" },
  ]);
  const [editingCard, setEditingCard] = useState<Card | null>(null);
  const [addingCard, setAddingCard] = useState(false);
  const [newCard, setNewCard] = useState({ type: "", last4: "", expiry: "" });

  // Cafe state (POS systems)
  const [posSystems, setPosSystems] = useState<POS[]>([
    { id: 1, name: "Square", connected: true },
    { id: 2, name: "Clover", connected: false },
  ]);

  // Cafe modals
  const [showConnectModal, setShowConnectModal] = useState<POS | null>(null);
  const [showDisconnectModal, setShowDisconnectModal] = useState<POS | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const togglePOS = (id: number) => {
    setPosSystems((prev) =>
      prev.map((p) => (p.id === id ? { ...p, connected: !p.connected } : p))
    );
  };

  const saveEdit = () => {
    if (!editingCard) return;
    setPaymentMethods((prev) =>
      prev.map((c) => (c.id === editingCard.id ? editingCard : c))
    );
    setEditingCard(null);
  };

  const deleteCard = (id: number) => {
    setPaymentMethods((prev) => prev.filter((c) => c.id !== id));
    setEditingCard(null);
  };

  const addCard = () => {
    setPaymentMethods((prev) => [
      ...prev,
      { id: Date.now(), ...newCard } as Card,
    ]);
    setAddingCard(false);
    setNewCard({ type: "", last4: "", expiry: "" });
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
        <h1 className="text-xl font-semibold">
          {role === "customer" ? "Payment Methods" : "POS Systems"}
        </h1>
      </header>

      {/* Wallet / POS Summary */}
      {role === "customer" ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-lg mx-auto bg-card rounded-2xl border border-border p-4 mb-4"
        >
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-muted">
              <Wallet className="h-6 w-6 text-caramel" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">CafeHop Wallet</p>
              <p className="text-lg font-semibold">1,250 points</p>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-4">
            <Coffee className="h-4 w-4 text-caramel" />
            <p className="text-sm text-muted-foreground">
              Redeem points at checkout — no card required
            </p>
          </div>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-lg mx-auto bg-card rounded-2xl border border-border p-4 mb-4"
        >
          <p className="text-sm text-muted-foreground mb-2">
            Connect or disconnect your POS system
          </p>
          <div className="space-y-3">
            {posSystems.map((pos, index) => (
              <motion.div
                key={pos.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center justify-between p-4 bg-card rounded-2xl border border-border"
              >
                <div className="flex items-center gap-3">
                  <Server className="h-5 w-5 text-caramel" />
                  <p className="font-medium">{pos.name}</p>
                </div>
                <Button
                  size="sm"
                  variant={pos.connected ? "default" : "outline"}
                  onClick={() => {
                    if (pos.connected) {
                      setShowDisconnectModal(pos);
                    } else {
                      setShowConnectModal(pos);
                    }
                  }}
                >
                  {pos.connected ? "Connected" : "Connect"}
                </Button>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Cards / POS Management */}
      {role === "customer" ? (
        <main className="max-w-lg mx-auto">
          <p className="text-sm font-medium mb-2">Saved Cards</p>

          <div className="space-y-3">
            {paymentMethods.map((card, index) => (
              <motion.div
                key={card.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center gap-3 p-4 bg-card rounded-2xl border border-border cursor-pointer"
                onClick={() => setEditingCard(card)}
              >
                <div className="p-2 rounded-xl bg-muted">
                  <CreditCard className="h-5 w-5 text-caramel" />
                </div>

                <div className="flex-1">
                  <p className="font-medium">
                    {card.type} •••• {card.last4}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Expires {card.expiry}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Add card */}
          <Button
            variant="outline"
            className="w-full mt-4 flex items-center gap-2"
            onClick={() => setAddingCard(true)}
          >
            <Plus className="h-4 w-4" />
            Add payment method
          </Button>
        </main>
      ) : null}

      {/* Customer modals (edit / add card) remain unchanged */}
      {role === "customer" && editingCard && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card p-6 rounded-2xl w-full max-w-sm relative">
            <button
              onClick={() => setEditingCard(null)}
              className="absolute top-3 right-3 p-1 rounded-full hover:bg-muted transition"
            >
              <X className="h-4 w-4" />
            </button>
            <h2 className="font-semibold text-lg mb-4">Edit Card</h2>

            <input
              type="text"
              className="w-full mb-2 p-2 border rounded"
              placeholder="Card Type"
              value={editingCard.type}
              onChange={(e) =>
                setEditingCard({ ...editingCard, type: e.target.value })
              }
            />
            <input
              type="text"
              className="w-full mb-2 p-2 border rounded"
              placeholder="Last 4 digits"
              value={editingCard.last4}
              onChange={(e) =>
                setEditingCard({ ...editingCard, last4: e.target.value })
              }
            />
            <input
              type="text"
              className="w-full mb-4 p-2 border rounded"
              placeholder="Expiry"
              value={editingCard.expiry}
              onChange={(e) =>
                setEditingCard({ ...editingCard, expiry: e.target.value })
              }
            />

            <div className="flex gap-2">
              <Button className="flex-1" onClick={saveEdit}>
                Save
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={() => deleteCard(editingCard.id)}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}

      {role === "customer" && addingCard && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card p-6 rounded-2xl w-full max-w-sm relative">
            <button
              onClick={() => setAddingCard(false)}
              className="absolute top-3 right-3 p-1 rounded-full hover:bg-muted transition"
            >
              <X className="h-4 w-4" />
            </button>
            <h2 className="font-semibold text-lg mb-4">Add Card</h2>

            <input
              type="text"
              className="w-full mb-2 p-2 border rounded"
              placeholder="Card Type"
              value={newCard.type}
              onChange={(e) => setNewCard({ ...newCard, type: e.target.value })}
            />
            <input
              type="text"
              className="w-full mb-2 p-2 border rounded"
              placeholder="Last 4 digits"
              value={newCard.last4}
              onChange={(e) => setNewCard({ ...newCard, last4: e.target.value })}
            />
            <input
              type="text"
              className="w-full mb-4 p-2 border rounded"
              placeholder="Expiry"
              value={newCard.expiry}
              onChange={(e) => setNewCard({ ...newCard, expiry: e.target.value })}
            />

            <Button className="w-full" onClick={addCard}>
              Add Card
            </Button>
          </div>
        </div>
      )}

      {/* Cafe POS Modals */}
      {role === "cafe" && showConnectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card p-6 rounded-2xl w-full max-w-sm relative">
            <button
              onClick={() => setShowConnectModal(null)}
              className="absolute top-3 right-3 p-1 rounded-full hover:bg-muted transition"
            >
              <X className="h-4 w-4" />
            </button>
            <h2 className="font-semibold text-lg mb-4">Connect {showConnectModal.name}</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Enter your POS credentials to connect.
            </p>

            <input type="text" placeholder="Username" className="w-full mb-2 p-2 border rounded"/>
            <input type="password" placeholder="Password" className="w-full mb-4 p-2 border rounded"/>

            <Button
              className="w-full"
              onClick={() => {
                setShowConnectModal(null);
                setShowConfirmation(true);
              }}
            >
              Submit
            </Button>
          </div>
        </div>
      )}

      {role === "cafe" && showDisconnectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card p-6 rounded-2xl w-full max-w-sm relative">
            <button
              onClick={() => setShowDisconnectModal(null)}
              className="absolute top-3 right-3 p-1 rounded-full hover:bg-muted transition"
            >
              <X className="h-4 w-4" />
            </button>
            <h2 className="font-semibold text-lg mb-4">Disconnect {showDisconnectModal.name}?</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Are you sure you want to disconnect this POS system?
            </p>

            <div className="flex gap-2">
              <Button
                className="flex-1"
                onClick={() => {
                  togglePOS(showDisconnectModal.id);
                  setShowDisconnectModal(null);
                }}
              >
                Yes, disconnect
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowDisconnectModal(null)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {role === "cafe" && showConfirmation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card p-6 rounded-2xl w-full max-w-sm relative text-center">
            <button
              onClick={() => setShowConfirmation(false)}
              className="absolute top-3 right-3 p-1 rounded-full hover:bg-muted transition"
            >
              <X className="h-4 w-4" />
            </button>
            <p className="text-lg font-semibold mb-2">Request submitted!</p>
            <p className="text-sm text-muted-foreground">
              You will receive a confirmation once your POS connection is approved.
            </p>
            <Button className="mt-4 w-full" onClick={() => setShowConfirmation(false)}>
              Close
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentMethods;
