import abi from "../utils/BuyMeACoffee.json";
import { ethers } from "ethers";
import Head from "next/head";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import styles from "../styles/Home.module.css";
import Select from "react-select";
import NativeSelect from "@material-ui/core/NativeSelect";
import Modal from "react-modal";

export default function Home() {
  // Contract Address & ABI
  const contractAddress = "0x91811f4f6fa4411915aCecb38F95f8836131B944";
  const contractABI = abi.abi;

  // Component state
  const [currentAccount, setCurrentAccount] = useState("");
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [memos, setMemos] = useState([]);
  const [withdrawTo, setWithdrawTo] = useState("");
  const [coffeeValue, setCoffeeValue] = useState("0.001");
  const [coffeeLabel, setCoffeeLabel] = useState("Small");
  const [formClicked, setFormClicked] = useState(false);

  const onNameChange = (event) => {
    setName(event.target.value);
  };

  const onMessageChange = (event) => {
    setMessage(event.target.value);
  };

  const onAddressChange = (event) => {
    setWithdrawTo(event.target.value);
  };

  const coffeeSize = [
    { value: 0.001, label: "Small" },
    { value: 0.003, label: "Large" },
  ];

  const handleChange = (coffeeSize) => {
    setCoffeeValue(coffeeSize.value);
    setCoffeeLabel(coffeeSize.label);
    console.log(coffeeValue);
  };

  const onFormClicked = () => {
    setFormClicked(true);
  };

  // Wallet connection logic
  const isWalletConnected = async () => {
    try {
      const { ethereum } = window;

      const accounts = await ethereum.request({ method: "eth_accounts" });
      console.log("accounts: ", accounts);

      if (accounts.length > 0) {
        const account = accounts[0];
        console.log("wallet is connected! " + account);
      } else {
        console.log("make sure MetaMask is connected");
      }
    } catch (error) {
      console.log("error: ", error);
    }
  };

  const connectWallet = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        console.log("please install MetaMask");
      }

      const accounts = await ethereum.request({
        method: "eth_requestAccounts",
      });

      setCurrentAccount(accounts[0]);
    } catch (error) {
      console.log(error);
    }
  };

  const buyCoffee = async () => {
    try {
      const { ethereum } = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum, "any");
        const signer = provider.getSigner();
        const buyMeACoffee = new ethers.Contract(
          contractAddress,
          contractABI,
          signer
        );

        console.log("buying coffee..");
        const coffeeTxn = await buyMeACoffee.buyCoffee(
          name ? name : "Anonymous",
          message ? message : "Enjoy your coffee!",
          { value: ethers.utils.parseEther(`${coffeeValue}`) }
        );

        await coffeeTxn.wait();

        console.log("mined ", coffeeTxn.hash);

        console.log("coffee purchased!");

        // Clear the form fields.
        setName("");
        setMessage("");
      }
    } catch (error) {
      console.log(error);
    }
  };

  const withdraw = async () => {
    try {
      const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const buyMeACoffee = new ethers.Contract(
          contractAddress,
          contractABI,
          signer
        );

        console.log("Withdrawing to:", withdrawTo);
        const withdrawTxn = await buyMeACoffee.withdrawTips(
          withdrawTo ? withdrawTo : "Address to send the tips"
        );

        await withdrawTxn.wait();
        console.log("Withdrawn!", withdrawTxn.hash);

        setWithdrawTo("");
      } else {
        console.log("Failed to withdraw");
      }
    } catch (error) {
      console.log(error);
    }
  };

  // Function to fetch all memos stored on-chain.
  const getMemos = async () => {
    try {
      const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const buyMeACoffee = new ethers.Contract(
          contractAddress,
          contractABI,
          signer
        );

        console.log("fetching memos from the blockchain..");
        const memos = await buyMeACoffee.getMemos();
        console.log("fetched!");
        setMemos(memos);
      } else {
        console.log("Metamask is not connected");
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    let buyMeACoffee;
    isWalletConnected();
    getMemos();

    // Create an event handler function for when someone sends
    // us a new memo.
    const onNewMemo = (from, timestamp, name, message) => {
      console.log("Memo received: ", from, timestamp, name, message);
      setMemos((prevState) => [
        ...prevState,
        {
          address: from,
          timestamp: new Date(timestamp * 1000),
          message,
          name,
        },
      ]);
    };

    const { ethereum } = window;

    // Listen for new memo events.
    if (ethereum) {
      const provider = new ethers.providers.Web3Provider(ethereum, "any");
      const signer = provider.getSigner();
      buyMeACoffee = new ethers.Contract(contractAddress, contractABI, signer);

      buyMeACoffee.on("NewMemo", onNewMemo);
    }

    return () => {
      if (buyMeACoffee) {
        buyMeACoffee.off("NewMemo", onNewMemo);
      }
    };
  }, [contractABI]);

  return (
    <div className={styles.container}>
      <Head>
        <title>Buy 0xSenzel a Coffee!</title>
        <meta name="description" content="Tipping site" />
        <link rel="icon" href="/latte.png" />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>Buy 0xSenzel a Coffee!</h1>
        {currentAccount ? (
          <div className={styles.donateElements}>
            <button className={styles.openFormButton} onClick={onFormClicked}>
              Withdraw
            </button>
            <form>
              <div>
                <label className={styles.donateText}>Name</label>
                <br />
                <input
                  id="name"
                  type="text"
                  placeholder="Enter your name"
                  onChange={onNameChange}
                  className={styles.donateInput}
                />
              </div>
              <br />
              <div>
                <label className={styles.donateText}>
                  Send 0xSenzel a message
                </label>
                <br />

                <textarea
                  rows={3}
                  placeholder="Enjoy your coffee!"
                  id="message"
                  onChange={onMessageChange}
                  required
                  className={styles.donateInput}
                ></textarea>
              </div>
              <div>
                <Select
                  options={coffeeSize}
                  value={coffeeSize.value}
                  onChange={handleChange}
                  className={styles.donateSelect}
                />
                <button
                  type="button"
                  className={styles.buy}
                  onClick={buyCoffee}
                >
                  Tip me a {coffeeLabel} coffee for {coffeeValue} ETH
                </button>
              </div>
            </form>
          </div>
        ) : (
          <button onClick={connectWallet} className={styles.connect}>
            {" "}
            Connect your wallet{" "}
          </button>
        )}
      </main>

      {currentAccount && <h1>Memos received</h1>}

      {currentAccount &&
        memos.map((memo, idx) => {
          return (
            <div
              key={idx}
              style={{
                border: "2px solid",
                borderRadius: "5px",
                padding: "5px",
                margin: "5px",
              }}
            >
              <p style={{ fontWeight: 'bold' }}>"{memo.message}"</p>
              <p>
                From: {memo.name} at {memo.timestamp.toString()}
              </p>
            </div>
          );
        })}

      {formClicked && (
        <Modal
          isOpen={formClicked}
          onRequestClose={() => setFormClicked(false)}
          root={document.getElementById("__next")}
          className={styles.withdrawForm}
        >
          <input
            id="withdrawTo"
            type="text"
            placeholder="Address withdraw to..."
            className={styles.withdrawInput}
            onChange={onAddressChange}
          />
          <br></br>
          <button
            type="button"
            className={styles.withdrawButton}
            onClick={withdraw}
          >
            Empty your tipping jar!
          </button>
          <button
            onClick={() => setFormClicked(false)}
            className={styles.withdrawCloseButton}
          >
            X
          </button>
        </Modal>
      )}

      <footer className={styles.footer}>
        <a
          href="https://twitter.com/0xSenzeI"
          target="_blank"
          rel="noopener noreferrer"
        >
          Created by @0xSenzel
        </a>
      </footer>
    </div>
  );
}
