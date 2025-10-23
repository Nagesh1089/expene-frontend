import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import * as d3 from "d3";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "bootstrap/dist/css/bootstrap.min.css";

function App() {
  const [expenses, setExpenses] = useState([]);
  const [form, setForm] = useState({ title: "", amount: "", category: "" });
  const [editingId, setEditingId] = useState(null);
  const [filterCategory, setFilterCategory] = useState("All");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const chartRef = useRef();

  const API_URL = "http://127.0.0.1:8000/api/expenses/";

  useEffect(() => {
    if (isLoggedIn) {
      fetchExpenses();
    }
  }, [isLoggedIn]);

  const fetchExpenses = async () => {
    try {
      const res = await axios.get(API_URL);
      setExpenses(res.data);
      drawChart(res.data);
    } catch (error) {
      toast.error("Failed to load expenses!");
    }
  };

  // ---------------- LOGIN FUNCTION ----------------
  const handleLogin = (e) => {
    e.preventDefault();
    const { username, password } = loginForm;
    if (username === "nagesh" && password === "nagesh") {
      toast.success("Login successful!");
      setIsLoggedIn(true);
    } else {
      toast.error("Invalid credentials!");
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    toast.info("Logged out successfully!");
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await axios.put(`${API_URL}${editingId}/`, form);
        toast.success("Expense updated successfully!");
        setEditingId(null);
      } else {
        await axios.post(API_URL, form);
        toast.success("Expense added successfully!");
      }
      setForm({ title: "", amount: "", category: "" });
      fetchExpenses();
    } catch (error) {
      toast.error("Something went wrong while saving!");
    }
  };

  const handleEdit = (expense) => {
    setForm({
      title: expense.title,
      amount: expense.amount,
      category: expense.category,
    });
    setEditingId(expense.id);
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API_URL}${id}/`);
      toast.info("Expense deleted!");
      fetchExpenses();
    } catch (error) {
      toast.error("Failed to delete expense!");
    }
  };

  // ---------------- FILTER LOGIC ----------------
  const filteredExpenses =
    filterCategory === "All"
      ? expenses
      : expenses.filter((exp) => exp.category === filterCategory);

  const categories = ["All", ...new Set(expenses.map((e) => e.category))];
  const totalAmount = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

  // ---------------- D3 CHART ----------------
  const drawChart = (data) => {
    if (!chartRef.current) return;
    d3.select(chartRef.current).selectAll("*").remove();

    const totals = Array.from(
      d3.rollup(
        data,
        (v) => d3.sum(v, (d) => +d.amount),
        (d) => d.category
      ),
      ([key, value]) => ({ category: key, total: value })
    );

    const width = 300;
    const height = 300;
    const radius = Math.min(width, height) / 2;

    const svg = d3
      .select(chartRef.current)
      .append("svg")
      .attr("width", width)
      .attr("height", height)
      .append("g")
      .attr("transform", `translate(${width / 2},${height / 2})`);

    const color = d3.scaleOrdinal(d3.schemeSet3);
    const pie = d3.pie().value((d) => d.total);
    const arc = d3.arc().innerRadius(0).outerRadius(radius);

    svg
      .selectAll("path")
      .data(pie(totals))
      .enter()
      .append("path")
      .attr("d", arc)
      .attr("fill", (d) => color(d.data.category))
      .attr("stroke", "#fff")
      .attr("stroke-width", "2px");

    svg
      .selectAll("text")
      .data(pie(totals))
      .enter()
      .append("text")
      .text((d) => `${d.data.category}`)
      .attr("transform", (d) => `translate(${arc.centroid(d)})`)
      .style("text-anchor", "middle")
      .style("font-size", "12px");
  };

  useEffect(() => {
    if (isLoggedIn) drawChart(expenses);
  }, [expenses]);

  // ---------------- LOGIN SCREEN ----------------
  if (!isLoggedIn) {
    return (
      <div className="container mt-5 d-flex justify-content-center">
        <div className="card p-4 shadow-sm" style={{ width: "350px" }}>
          <h3 className="text-center mb-4">Login</h3>
          <form onSubmit={handleLogin}>
            <div className="mb-3">
              <label className="form-label">Username</label>
              <input
                type="text"
                className="form-control shadow-none"
                name="username"
                value={loginForm.username}
                onChange={(e) =>
                  setLoginForm({ ...loginForm, username: e.target.value })
                }
                required
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Password</label>
              <input
                type="password"
                className="form-control shadow-none"
                name="password"
                value={loginForm.password}
                onChange={(e) =>
                  setLoginForm({ ...loginForm, password: e.target.value })
                }
                required
              />
            </div>
            <button type="submit" className="btn btn-primary w-100">
              Login
            </button>
          </form>
          <ToastContainer position="top-center" autoClose={2000} />
        </div>
      </div>
    );
  }

  // ---------------- MAIN APP SCREEN ----------------
  return (
    <div className="container mt-5">
      <ToastContainer position="top-right" autoClose={2000} />
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Expense Tracker</h1>
        <button className="btn btn-outline-danger" onClick={handleLogout}>
          Logout
        </button>
      </div>

      {/* Add/Edit Form */}
      <div className="card p-4 shadow-sm mb-4">
        <h4>{editingId ? "Edit Expense" : "Add Expense"}</h4>
        <form
          onSubmit={handleSubmit}
          className="row g-3 align-items-center mt-2"
        >
          <div className="col-md-4">
            <input
              name="title"
              className="form-control shadow-none"
              value={form.title}
              onChange={handleChange}
              placeholder="Title"
              required
            />
          </div>
          <div className="col-md-3">
            <input
              name="amount"
              type="number"
              className="form-control shadow-none"
              value={form.amount}
              onChange={handleChange}
              placeholder="Amount"
              required
            />
          </div>
          <div className="col-md-3">
            <input
              name="category"
              className="form-control shadow-none"
              value={form.category}
              onChange={handleChange}
              placeholder="Category"
              required
            />
          </div>
          <div className="col-md-2">
            <button type="submit" className="btn btn-success w-100">
              {editingId ? "Update" : "Add"}
            </button>
          </div>
        </form>
      </div>

      {/* Filter Dropdown */}
      <div className="mb-3 text-end">
        <label className="me-2 fw-bold">Filter:</label>
        <select
          className="form-select d-inline-block w-auto"
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
        >
          {categories.map((cat, idx) => (
            <option key={idx} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      {/* Expenses Table */}
      <h5 className="text-secondary mb-3">Expenses</h5>
      <div className="table-responsive mb-4">
        <table className="table table-striped table-hover align-middle">
          <thead className="table-primary">
            <tr>
              <th>Id</th>
              <th>Title</th>
              <th>Amount (₹)</th>
              <th>Category</th>
              <th className="text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredExpenses.length > 0 ? (
              filteredExpenses.map((exp, index) => (
                <tr key={exp.id}>
                  <td>{index + 1}</td>
                  <td>{exp.title}</td>
                  <td>{exp.amount}</td>
                  <td>
                    <span className="badge bg-info text-dark">
                      {exp.category}
                    </span>
                  </td>
                  <td className="text-center">
                    <button
                      className="btn btn-sm btn-outline-warning me-2"
                      onClick={() => handleEdit(exp)}
                    >
                      Edit
                    </button>
                    <button
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => handleDelete(exp.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="text-center text-muted">
                  No expenses found.
                </td>
              </tr>
            )}
          </tbody>
          {expenses.length > 0 && (
            <tfoot>
              <tr>
                <td colSpan="2" className="fw-bold text-end">
                  Total:
                </td>
                <td colSpan="3" className="fw-bold">
                  ₹{totalAmount}
                </td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* D3 Pie Chart */}
      <div className="card p-4 shadow-sm">
        <h5 className="text-center mb-3">Spending by Category</h5>
        <div
          ref={chartRef}
          className="d-flex justify-content-center align-items-center"
        ></div>
      </div>
    </div>
  );
}

export default App;
