import { useState, useEffect } from "react";
import { BrowserProvider, Contract, ethers } from "ethers";

const CONTRACT_ADDRESS = "YOUR_CONTRACT_ADDRESS";
const ABI = [
  "function question() view returns (string)",
  "function deadline() view returns (uint256)",
  "function yesPool() view returns (uint256)",
  "function noPool() view returns (uint256)",
  "function resolved() view returns (bool)",
  "function outcome() view returns (bool)",
  "function buyYes() payable",
  "function buyNo() payable",
  "function claimReward()"
];

function App() {
  const [account, setAccount] = useState(null);
  const [network, setNetwork] = useState(null);
  const [contract, setContract] = useState(null);
  const [contractAddress] = useState(CONTRACT_ADDRESS);
  const [question, setQuestion] = useState("");
  const [deadline, setDeadline] = useState("0");
  const [yesPool, setYesPool] = useState("0");
  const [noPool, setNoPool] = useState("0");
  const [resolved, setResolved] = useState(false);
  const [outcome, setOutcome] = useState(null);
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState(null);
  const [status, setStatus] = useState({ type: "", message: "" });

  const isMarketClosed = parseInt(deadline) > 0 && Date.now() / 1000 > parseInt(deadline);

  useEffect(() => {
    connectWallet();
  }, []);

  useEffect(() => {
    if (contract) {
      fetchMarketData();
    }
  }, [contract]);

  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        setStatus({ type: "error", message: "MetaMask not installed" });
        return;
      }
      const provider = new BrowserProvider(window.ethereum);
      const network = await provider.getNetwork();
      setNetwork(network.name || `Chain ${network.chainId}`);
      const accounts = await provider.send("eth_requestAccounts", []);
      const signer = await provider.getSigner();
      const predictionMarket = new Contract(CONTRACT_ADDRESS, ABI, signer);
      setAccount(accounts[0]);
      setContract(predictionMarket);
    } catch (err) {
      setStatus({ type: "error", message: err.message });
    }
  };

  const fetchMarketData = async () => {
    try {
      const q = await contract.question();
      const d = await contract.deadline();
      const yes = await contract.yesPool();
      const no = await contract.noPool();
      const r = await contract.resolved();
      const o = r ? await contract.outcome() : null;
      
      setQuestion(q);
      setDeadline(d.toString());
      setYesPool(yes.toString());
      setNoPool(no.toString());
      setResolved(r);
      setOutcome(o);
    } catch (err) {
      console.error(err);
    }
  };

  const formatDeadline = (ts) => {
    if (!ts || ts === "0") return "N/A";
    const date = new Date(parseInt(ts) * 1000);
    return date.toLocaleString();
  };

  const getOutcomeText = () => {
    if (!resolved) return "Unresolved";
    return outcome ? "Yes" : "No";
  };

  const handleBuyYes = async () => {
    if (!amount || parseFloat(amount) <= 0) return;
    setLoading(true);
    setStatus({ type: "", message: "" });
    setTxHash(null);
    try {
      const tx = await contract.buyYes({ value: ethers.parseEther(amount) });
      setTxHash(tx.hash);
      setStatus({ type: "pending", message: "Transaction pending..." });
      await tx.wait();
      await fetchMarketData();
      setAmount("");
      setStatus({ type: "success", message: "Successfully bought YES!" });
    } catch (err) {
      setStatus({ type: "error", message: err.message });
    }
    setLoading(false);
  };

  const handleBuyNo = async () => {
    if (!amount || parseFloat(amount) <= 0) return;
    setLoading(true);
    setStatus({ type: "", message: "" });
    setTxHash(null);
    try {
      const tx = await contract.buyNo({ value: ethers.parseEther(amount) });
      setTxHash(tx.hash);
      setStatus({ type: "pending", message: "Transaction pending..." });
      await tx.wait();
      await fetchMarketData();
      setAmount("");
      setStatus({ type: "success", message: "Successfully bought NO!" });
    } catch (err) {
      setStatus({ type: "error", message: err.message });
    }
    setLoading(false);
  };

  const handleClaimReward = async () => {
    setLoading(true);
    setStatus({ type: "", message: "" });
    try {
      const tx = await contract.claimReward();
      setTxHash(tx.hash);
      setStatus({ type: "pending", message: "Transaction pending..." });
      await tx.wait();
      setStatus({ type: "success", message: "Reward claimed successfully!" });
    } catch (err) {
      setStatus({ type: "error", message: err.message });
    }
    setLoading(false);
  };

  const styles = {
    container: {
      padding: "20px",
      maxWidth: "500px",
      margin: "40px auto",
      fontFamily: "system-ui, sans-serif",
      backgroundColor: "#fafafa",
      borderRadius: "8px",
      border: "1px solid #ddd"
    },
    header: {
      textAlign: "center",
      marginBottom: "20px",
      color: "#333"
    },
    infoBox: {
      backgroundColor: "#fff",
      padding: "12px",
      borderRadius: "6px",
      marginBottom: "16px",
      border: "1px solid #eee"
    },
    infoRow: {
      display: "flex",
      justifyContent: "space-between",
      marginBottom: "6px",
      fontSize: "13px"
    },
    label: {
      color: "#666"
    },
    value: {
      color: "#333",
      fontFamily: "monospace",
      fontSize: "12px"
    },
    poolSection: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: "12px",
      marginBottom: "16px"
    },
    poolCard: {
      backgroundColor: "#fff",
      padding: "16px",
      borderRadius: "6px",
      textAlign: "center",
      border: "1px solid #eee"
    },
    poolTitle: {
      fontSize: "12px",
      color: "#666",
      marginBottom: "4px"
    },
    poolValue: {
      fontSize: "18px",
      fontWeight: "600",
      color: "#333"
    },
    input: {
      width: "100%",
      padding: "10px",
      borderRadius: "6px",
      border: "1px solid #ddd",
      fontSize: "14px",
      marginBottom: "12px",
      boxSizing: "border-box"
    },
    buttonGroup: {
      display: "flex",
      gap: "8px",
      marginBottom: "12px"
    },
    button: {
      flex: 1,
      padding: "10px",
      borderRadius: "6px",
      border: "none",
      fontSize: "13px",
      cursor: "pointer"
    },
    buyYesBtn: {
      backgroundColor: "#28a745",
      color: "#fff"
    },
    buyNoBtn: {
      backgroundColor: "#dc3545",
      color: "#fff"
    },
    claimBtn: {
      backgroundColor: "#007bff",
      color: "#fff"
    },
    disabledBtn: {
      opacity: 0.5,
      cursor: "not-allowed"
    },
    statusBox: {
      padding: "10px",
      borderRadius: "6px",
      marginTop: "12px",
      textAlign: "center",
      fontSize: "13px"
    },
    successStatus: {
      backgroundColor: "#d4edda",
      color: "#155724"
    },
    errorStatus: {
      backgroundColor: "#f8d7da",
      color: "#721c24"
    },
    pendingStatus: {
      backgroundColor: "#fff3cd",
      color: "#856404"
    },
    connectBtn: {
      padding: "10px 24px",
      backgroundColor: "#333",
      color: "#fff",
      border: "none",
      borderRadius: "6px",
      fontSize: "14px",
      cursor: "pointer"
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.header}>{question || "Prediction Market"}</h2>
      
      {!account ? (
        <div style={{ textAlign: "center" }}>
          <button style={styles.connectBtn} onClick={connectWallet}>
            Connect MetaMask
          </button>
        </div>
      ) : (
        <div style={styles.infoBox}>
          <div style={styles.infoRow}>
            <span style={styles.label}>Network</span>
            <span style={styles.value}>{network}</span>
          </div>
          <div style={styles.infoRow}>
            <span style={styles.label}>Deadline</span>
            <span style={styles.value}>{formatDeadline(deadline)}</span>
          </div>
          <div style={styles.infoRow}>
            <span style={styles.label}>Outcome</span>
            <span style={styles.value}>{getOutcomeText()}</span>
          </div>
        </div>
      )}

      <div style={styles.poolSection}>
        <div style={styles.poolCard}>
          <div style={styles.poolTitle}>YES Pool</div>
          <div style={styles.poolValue}>{ethers.formatEther(yesPool)} ETH</div>
        </div>
        <div style={styles.poolCard}>
          <div style={styles.poolTitle}>NO Pool</div>
          <div style={styles.poolValue}>{ethers.formatEther(noPool)} ETH</div>
        </div>
      </div>

      <input
        type="number"
        placeholder="Amount in ETH"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        style={styles.input}
        disabled={loading || isMarketClosed}
      />

      <div style={styles.buttonGroup}>
        <button 
          onClick={handleBuyYes} 
          disabled={loading || !account || isMarketClosed}
          style={{ ...styles.button, ...styles.buyYesBtn, ...(loading || !account || isMarketClosed ? styles.disabledBtn : {}) }}
        >
          {loading ? "..." : "Buy Yes"}
        </button>
        <button 
          onClick={handleBuyNo} 
          disabled={loading || !account || isMarketClosed}
          style={{ ...styles.button, ...styles.buyNoBtn, ...(loading || !account || isMarketClosed ? styles.disabledBtn : {}) }}
        >
          {loading ? "..." : "Buy No"}
        </button>
        {resolved && (
          <button 
            onClick={handleClaimReward} 
            disabled={loading || !account}
            style={{ ...styles.button, ...styles.claimBtn, ...(loading || !account ? styles.disabledBtn : {}) }}
          >
            Claim
          </button>
        )}
      </div>

      {status.message && (
        <div style={{
          ...styles.statusBox,
          ...(status.type === "success" ? styles.successStatus : 
              status.type === "error" ? styles.errorStatus : styles.pendingStatus)
        }}>
          {status.message}
        </div>
      )}
    </div>
  );
}

export default App;
