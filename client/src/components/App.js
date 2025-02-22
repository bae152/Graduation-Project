import React, { useState, useEffect } from "react";
import NavBar from "./modules/NavBar.js";
import Simulation from "./pages/Simulation.js";
import Data from "./pages/Data.js";
import Parameter from "./pages/Parameter.js";

import { Routes, Route } from "react-router-dom";

import jwt_decode from "jwt-decode";

import NotFound from "./pages/NotFound.js";
import Skeleton from "./pages/Skeleton.js";

import "../utilities.css";

import { socket } from "../client-socket.js";

import { get, post } from "../utilities";
import Login from "./pages/Login.js";

/**
 * Define the "App" component
 */
const App = () => {
  const [userId, setUserId] = useState(undefined);

  useEffect(() => {
    get("/api/whoami").then((user) => {
      if (user._id) {
        // they are registed in the database, and currently logged in.
        setUserId(user._id);
      }
    });
  }, []);

  const handleLogin = (credentialResponse) => {
    const userToken = credentialResponse.credential;
    const decodedCredential = jwt_decode(userToken);
    console.log(`Logged in as ${decodedCredential.name}`);
    post("/api/login", { token: userToken }).then((user) => {
      setUserId(user._id);
      post("/api/initsocket", { socketid: socket.id });
    });
    console.log(userToken);
  };

  const handleLogout = () => {
    setUserId(undefined);
    post("/api/logout");
  };

  return (
    <>
      <NavBar handleLogin={handleLogin} handleLogout={handleLogout} userId={userId} />
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/simulation/" element={<Simulation />} />
        <Route path="/data/" element={<Data />} />
        <Route path="/parameter/" element={<Parameter />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
};

export default App;
