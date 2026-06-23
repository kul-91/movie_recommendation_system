import React, { useEffect } from 'react'
import { Routes, Route, Navigate } from "react-router-dom"
import { Loader } from "lucide-react";

import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import SignUpPage from "./pages/SignUpPage"
import LoginPage from "./pages/LoginPage"
import { useAuthStore } from './store/useAuthStore';
import { Toaster } from 'react-hot-toast';

const App = () => {
    const { authUser, checkAuth, isCheckingAuth } = useAuthStore();

    useEffect(() => {
        checkAuth()
    }, [checkAuth]);

    if (isCheckingAuth && !authUser) return (

        <div className='flex items-center justify-center h-screen'>
            <Loader className='size-10 animate-spin' />
        </div>
    )

    return (
        <>
            <Navbar />
            <Routes>
                <Route path="/" element={authUser ? <HomePage /> : <Navigate to="/login" />} />
                <Route path="/signup" element={!authUser ? <SignUpPage /> : <Navigate to="/" />} />
                <Route path="/login" element={!authUser ? < LoginPage /> : <Navigate to="/" />} />

            </Routes>

            <Toaster />
        </>
    )
}

export default App