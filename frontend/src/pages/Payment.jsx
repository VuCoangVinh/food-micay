import React from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, ArrowLeft } from "lucide-react";

const Payment = () => {
  const navigate = useNavigate();

  return (
    <div className="section">
      <div className="container" style={{ maxWidth: "800px", margin: "0 auto", padding: "3rem" }}>
        <div style={{ background: "rgba(255, 255, 255, 0.95)", borderRadius: "20px", padding: "3rem", boxShadow: "0 20px 40px rgba(0, 0, 0, 0.1)", textAlign: "center" }}>
          <div style={{ width: "100px", height: "100px", margin: "0 auto 2rem", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%", background: "#fed7d7" }}>
            <AlertTriangle size={42} color="#c53030" />
          </div>
          <h2 style={{ fontSize: "2rem", color: "#2d3748", marginBottom: "1rem" }}>
            Payment flow has changed
          </h2>
          <p style={{ color: "#4a5568", fontSize: "1rem", marginBottom: "2rem" }}>
            Please complete your order directly on the Checkout page using the available payment methods.
          </p>
          <button
            onClick={() => navigate("/checkout")}
            style={{
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              color: "white",
              border: "none",
              padding: "1rem 1.5rem",
              borderRadius: "12px",
              cursor: "pointer",
              fontWeight: "700"
            }}
          >
            <ArrowLeft size={18} style={{ marginRight: "0.5rem" }} />
            Back to Checkout
          </button>
        </div>
      </div>
    </div>
  );
};

export default Payment;
