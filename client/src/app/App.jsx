import React from "react";
import styled from "styled-components";
import { GlobalStyle } from "../shared/GlobalStyle";
import AppRoutes from "./app.routes.jsx";

export default function App() {
  return (
    <>
      <GlobalStyle />
      <Wrapper>
        <AppRoutes />
      </Wrapper>
    </>
  );
}

const Wrapper = styled.div`
  .loading-container {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: rgba(255, 255, 255, 0.8);
    z-index: 9999;
  }

  .spinner-wrapper {
    position: fixed;
    top: 0;
    left: 0;
    z-index: 9999;
    width: 100vw;
    height: 100vh;
    background: linear-gradient(135deg, #e3f2fd, #fce4ec);
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .spinner-ring {
    width: 150px;
    height: 150px;
    border: 8px solid transparent;
    border-top: 8px solid #dc620b;
    border-right: 8px solid #dc620b;
    border-radius: 50%;
    animation: spin 1.2s linear infinite;
    box-shadow: 0 0 8px rgba(238, 101, 3, 0.6);
    position: absolute;
  }

  .spinner-center {
    font-size: 20px;
    font-weight: bold;
    color: #dc620b;
    z-index: 1;
    animation: pulse 1.5s ease-in-out infinite;
  }

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }

  @keyframes pulse {
    0%,
    100% {
      transform: scale(1);
      opacity: 0.8;
    }
    50% {
      transform: scale(1.2);
      opacity: 1;
    }
  }
`;
