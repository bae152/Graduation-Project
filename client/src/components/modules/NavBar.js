import React from "react";
import { Link } from "react-router-dom";
import { GoogleOAuthProvider, GoogleLogin, googleLogout } from "@react-oauth/google";
import "./NavBar.css";

const GOOGLE_CLIENT_ID = "702682249782-9la4kls99j1fnisn7p0mhgavg54r0ic3.apps.googleusercontent.com";

const NavBar = (props) => {
  return (
    <nav className="NavBar-container">
      <div className="NavBar-left">
        <Link to="/" className="NavBar-title">
          水声通信网络可视化系统
        </Link>
        <div className="NavBar-linkContainer">
          <Link to="/simulation/" className="NavBar-link">
            仿真窗口
          </Link>
          <Link to="/data/" className="NavBar-link">
            数据窗口
          </Link>
          <Link to="/parameter/" className="NavBar-link">
            参数窗口
          </Link>
        </div>
      </div>
      <div className="NavBar-right">
        <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
          {props.userId ? (
            <>
              <Link to="/profile/" className="NavBar-link">
                个人中心
              </Link>
              <button
                onClick={() => {
                  googleLogout();
                  props.handleLogout();
                }}
                className="NavBar-button"
              >
                登出
              </button>
            </>
          ) : (
            <GoogleLogin
              buttonText="登录"
              onSuccess={props.handleLogin}
              onError={(err) => console.log(err)}
              className="NavBar-button"
            />
          )}
        </GoogleOAuthProvider>
      </div>
    </nav>
  );
};

export default NavBar;
