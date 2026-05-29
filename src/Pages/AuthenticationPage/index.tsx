import { Form, Formik } from "formik";
import React, { FC, useState } from "react";
import TextField from "../../Components/TextField";
import Button from "../../Components/Button";
import axios from "axios";
import { useCookies } from "react-cookie";
import { useNavigate } from "react-router-dom";
import style from "./style.module.css";
import useTheme from "../../context/Theme/useTheme";
import { userSchema } from "../../schema";
import useSnackbar from "../../context/Snackbar/useSnackbar";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faStore, faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";

/**
 * ## Authentication Page
 * Redesigned for a modern SaaS aesthetic.
 */
const AuthenticationPage: FC = () => {
  const snack = useSnackbar();
  const [, setCookies] = useCookies();
  const navigate = useNavigate();
  const theme = useTheme();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  return (
    <div className={style.container}>
      <div className={style.leftPanel}>
        <div className={style.brandContainer}>
          <div className={style.logoWrapper}>
            <FontAwesomeIcon icon={faStore} className={style.logoIcon} />
          </div>
          <h1 className={style.brandName}>EMMARKET POS</h1>
          <p className={style.brandTagline}>
            Smart Inventory & Sales Management<br/>for Modern Retail Businesses
          </p>
        </div>
        <div className={style.gradientGlow}></div>
      </div>

      <div className={style.rightPanel}>
        <Formik
          onSubmit={(values) => {
            setLoading(true);
            axios
              .post("http://localhost:5500/user/login", {
                username: values.username,
                password: values.password,
              })
              .then((res) => {
                snack.onResponse({ message: "Welcome back!", status: 201 });
                setCookies("auth", res.data, { expires: new Date(Date.now() + 7200 * 1000) });
                axios.defaults.headers.post.Authorization = "barear " + res.data.token;
                navigate("/");
              })
              .catch((err) => {
                setLoading(false);
                let errorMessage = "Authentication service unavailable";
                let errorStatus = 503;
                if (err.response) {
                  errorMessage = err.response.data?.message || "Login failed";
                  errorStatus = err.response.status || 500;
                }
                snack.onResponse({
                  message: errorMessage,
                  status: errorStatus,
                });
              });
          }}
          initialValues={{ username: "", password: "" }}
          validationSchema={userSchema}
        >
          {({ submitForm }) => (
            <Form className={style.form}>
              <div className={style.formHeader}>
                <h2>Welcome Back</h2>
                <p>Please enter your details to sign in.</p>
              </div>

              <div className={style.inputGroup}>
                <label htmlFor="username">Username</label>
                <TextField name="username" placeholder="Enter Username" />
              </div>

              <div className={style.inputGroup}>
                <label htmlFor="password">Password</label>
                <div className={style.passwordWrapper}>
                  <TextField
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter Password"
                  />
                  <button
                    type="button"
                    className={style.showPasswordBtn}
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="large"
                fullWidth
                loading={loading}
                className={style.submitBtn}
              >
                Sign In
              </Button>
            </Form>
          )}
        </Formik>

        {process.env.NODE_ENV === "development" && (
          <div className={style.demoAccountsPanel}>
            <h4>Demo Accounts</h4>
            <div className={style.demoRow}>
              <span><strong>Admin:</strong> admin / admin123</span>
            </div>
            <div className={style.demoRow}>
              <span><strong>Cashier:</strong> cashier / cashier123</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthenticationPage;
