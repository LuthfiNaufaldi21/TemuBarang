import React from "react";
import { Link } from "react-router-dom";
import heroBg from "../assets/Container.png";
import Secure from "../assets/secure.svg";
import PrivChatt from "../assets/privChatt.svg";
import AI from "../assets/aiMatch.svg";
import Report from "../assets/report.svg";
import Match from "../assets/match.svg";
import Recover from "../assets/recover.svg";
import Sahabat from "../assets/sahabat.svg";
import Edu from "../assets/edu.svg";
import Login from "../assets/login.svg";

function LandingPage() {
  return (
    // Wrapper 1
    <div className="w-full min-h-[100dvh] bg-black text-white overflow-x-hidden selection:bg-[#164A41] selection:text-white">
      {/*NAVBAR*/}
      <nav className="fixed top-0 left-0 w-full z-50 bg-black/90 backdrop-blur-md border-b border-[#4D774E]/20 px-4 md:px-12 py-4 md:py-5 flex justify-between items-center">
        <div className="text-xl md:text-2xl font-bold text-[#9DC88D]">
          <a href="#" className="hover:text-[#A4D2A2] transition-colors">
            TemuBarang
          </a>
        </div>

        <div className="hidden md:flex gap-8 text-[#9DC88D]/70 font-medium text-base">
          <a
            href="#features"
            className="hover:text-[#A4D2A2] transition-colors"
          >
            Features
          </a>
          <a href="#works" className="hover:text-[#A4D2A2] transition-colors">
            How it Works
          </a>
          <a href="#about" className="hover:text-[#A4D2A2] transition-colors">
            About
          </a>
          <a href="#support" className="hover:text-[#A4D2A2] transition-colors">
            Support
          </a>
        </div>

        <Link
          to="/login"
          className="bg-[#F1B24A] hover:bg-[#c28a30] text-black px-4 md:px-6 py-2 md:py-2.5 rounded-full text-sm md:text-base font-semibold transition-all duration-300 hover:shadow-[0_10px_25px_rgba(0,0,0,0.5)] hover:-translate-y-0.5"
        >
          Login
        </Link>
      </nav>

      {/*HERO SECTION*/}
      <section className="relative min-h-[100dvh] w-full flex items-center justify-center pt-24">
        <div className="absolute inset-0 z-0">
          <img
            src={heroBg}
            alt="USU Campus Background"
            className="w-full h-full object-cover opacity-100 scale-105 md:scale-100 transition-transform duration-2000 ease-out"
          />
          {/*Gradient overlay*/}
          <div className="absolute inset-0 bg-linear-to-b from-[#0A241F] via-[#164A41]/40 to-black/95" />
        </div>

        <div className="relative z-10 text-center px-4 max-w-4xl flex flex-col items-center opacity-0 animate-[fadeUp_0.9s_ease-out_forwards]">
          <h1 className="text-4xl sm:text-5xl md:text-[56px] font-semibold leading-[1.1] text-[#E2E3DD] tracking-tight">
            Temukan Barangmu,
            <br />
            Kembalikan<span> </span>
            <span className="text-[#F1B24A]">Senyum Mereka</span>
          </h1>
          <p className="mt-5 text-[#9DC88D] text-base md:text-[18px] leading-7 max-w-162.5 mx-auto font-medium">
            Connect with finders, verify ownership securely, and retrieve what
            matters.
          </p>
        </div>
      </section>

      {/*FEATURES*/}
      <section
        id="features"
        className="py-16 md:py-24 px-6 md:px-12 max-w-300 mx-auto flex flex-col items-center scroll-mt-24"
      >
        <h2 className="text-3xl md:text-[36px] font-semibold text-[#E2E3DD] mb-12">
          Features
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full">
          {/*card1*/}
          <div className="bg-[#164A41] p-6 md:p-8 rounded-3xl outline-1 outline-[#4D774E]/20 flex flex-col justify-between min-h-64 relative overflow-hidden group transform transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_24px_60px_rgba(0,0,0,0.7)]">
            {/* Glow effect bawaan desain */}
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-[#4D774E]/20 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <img
              src={Secure}
              alt="Secure Access Icon"
              className="w-10 h-7 relative z-10 transition-transform duration-300 group-hover:scale-110"
            />
            <div className="mt-12 relative z-10">
              <h3 className="text-[20px] font-semibold text-[#E2E3DD] mb-2">
                Secure Access
              </h3>
              <p className="text-[#9DC88D] text-[17px] leading-6">
                Verified campus identities ensure a trusted environment for
                exchanging items.
              </p>
            </div>
          </div>

          {/*card2*/}
          <div className="bg-[#164A41] p-6 md:p-8 rounded-3xl outline-1 outline-[#4D774E]/20 flex flex-col justify-between min-h-64 transform transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_24px_60px_rgba(0,0,0,0.7)]">
            <img
              src={PrivChatt}
              alt="Secure Access Icon"
              className="w-10 h-7 relative z-10 transition-transform duration-300 hover:scale-110"
            />
            <div className="mt-12 relative z-10">
              <h3 className="text-[20px] font-semibold text-[#E2E3DD] mb-2">
                Private Chat
              </h3>
              <p className="text-[#9DC88D] text-[17px] leading-6">
                Communicate securely with finders without exposing personal
                contact details.
              </p>
            </div>
          </div>

          {/*card3*/}
          <div className="bg-[#164A41] p-6 md:p-8 rounded-3xl outline-1 outline-[#4D774E]/20 flex flex-col justify-between min-h-64 transform transition-all duration-300 hover:-translate-y-2 hover:shadow-[0_24px_60px_rgba(0,0,0,0.7)]">
            <img
              src={AI}
              alt="AI Matching Icon"
              className="w-10 h-7 relative z-10 transition-transform duration-300 hover:scale-110"
            />
            <div className="mt-12 relative z-10">
              <h3 className="text-[20px] font-semibold text-[#E2E3DD] mb-2">
                AI Matching
              </h3>
              <p className="text-[#9DC88D] text-[17px] leading-6">
                Intelligent algorithms connect lost reports with found items
                automatically.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/*HOW IT WORKS*/}
      <section
        id="works"
        className="py-16 md:py-24 px-6 md:px-12 max-w-300 mx-auto flex flex-col items-center scroll-mt-24"
      >
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-[36px] font-semibold text-[#E2E3DD] mb-3">
            How It Works
          </h2>
          <p className="text-[#9DC88D] text-[17px] font-medium leading-6">
            Three simple steps to reunite with your belongings.
          </p>
        </div>

        {/*card how it works*/}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full relative items-center">
          <div className="hidden md:block absolute top-1/2 left-[15%] right-[15%] h-0.5 bg-[#4D774E]/30 z-0" />

          <div className="bg-black border border-[#4D774E]/40 rounded-3xl p-6 md:p-8 flex flex-col items-center text-center relative z-10 min-h-60">
            <div className="w-16 h-16 bg-[#164A41] rounded-full border-4 border-black flex items-center justify-center mb-6">
              <img
                src={Report}
                alt="Report Icon"
                className="w-6 h-6 relative z-10"
              />
            </div>
            <h3 className="text-[20px] text-white mb-3">1. Report</h3>
            <p className="text-[#BBCABF] text-[16px] leading-6">
              Submit details about your lost or found item.
            </p>
          </div>

          <div className="bg-black border border-[#4D774E]/30 rounded-3xl p-6 md:p-8 flex flex-col items-center text-center relative z-10 min-h-60">
            <div className="w-16 h-16 bg-[#164A41] rounded-full border-4 border-black flex items-center justify-center mb-6">
              <img
                src={Match}
                alt="Match Icon"
                className="w-8 h-8 relative z-10"
              />
            </div>
            <h3 className="text-[20px] text-white mb-3">2. Match</h3>
            <p className="text-[#BBCABF] text-[16px] leading-6">
              Our AI system finds potential matches instantly.
            </p>
          </div>

          <div className="bg-black border border-[#4D774E]/30 rounded-3xl p-6 md:p-8 flex flex-col items-center text-center relative z-10 min-h-60">
            <div className="w-16 h-16 bg-[#164A41] rounded-full border-4 border-black flex items-center justify-center mb-6">
              <img
                src={Recover}
                alt="Recover Icon"
                className="w-8 h-8 relative z-10"
              />
            </div>
            <h3 className="text-[20px] text-white mb-3">3. Recover</h3>
            <p className="text-[#BBCABF] text-[16px] leading-6">
              Securely chat and arrange a safe pickup.
            </p>
          </div>
        </div>
      </section>

      {/*ABOUT*/}
      <section
        id="about"
        className="py-16 md:py-24 bg-[#164A41]/20 border-y border-[#4D774E]/20 scroll-mt-24"
      >
        <div className="max-w-300 mx-auto px-6 md:px-12 flex flex-col md:flex-row items-center gap-12">
          <div className="flex-1 space-y-6">
            <h2 className="text-3xl md:text-[36px] text-white font-semibold">
              About TemuBarang
            </h2>
            <p className="text-[#9DC88D] text-[17px] leading-6.5">
              TemuBarang was born from a simple mission : <br />
              to build a safer and more trusting environment at the University
              of North Sumatra. We realized that losing something on a busy
              campus shouldn't mean losing it forever.
            </p>
            <p className="text-[#9DC88D] text-[17px] leading-6.5">
              By leveraging technology, we provide a secure, exclusive platform
              where students and staff can help each other, ensuring that lost
              items find their way back home.
            </p>
          </div>
          <div className="flex-1 flex justify-center">
            {/*buletan about*/}
            <div className="w-64 h-64 md:w-87.5 md:h-87.5 bg-[#164A41] rounded-full border border-[#4D774E]/30 flex items-center justify-center overflow-hidden shadow-[0_20px_45px_rgba(0,0,0,0.5)]">
              <img
                src={Sahabat}
                alt="Sahabat Icon"
                className="w-100 h-100 md:w-100 md:h-100 relative z-10 transition-transform duration-700 hover:scale-105"
              />
            </div>
          </div>
        </div>
      </section>

      {/*suprot*/}
      <section
        id="support"
        className="py-16 md:py-24 px-6 md:px-12 max-w-300 mx-auto flex flex-col items-center gap-16 scroll-mt-24"
      >
        <div className="w-full flex flex-col md:flex-row justify-between items-stretch md:items-center gap-6">
          <div>
            <h3 className="text-white text-[16px] mb-2">Need Help?</h3>
            <p className="text-[#BBCABF] text-[16px]">
              Our support team are available 24/7 to assist with any issues.
            </p>
          </div>
          <button className="w-full md:w-auto px-8 py-3 rounded-lg border border-[#10B981] text-[#10B981] hover:bg-[#10B981]/10 transition-colors duration-300 hover:shadow-[0_12px_30px_rgba(0,0,0,0.5)]">
            Contact Support
          </button>
        </div>

        {/*login card*/}
        <div className="w-full max-w-210 bg-linear-to-b from-[#164A41] to-[#0A241F] rounded-2xl border border-[#333333] shadow-[0_16px_40px_rgba(0,0,0,0.4)] flex flex-col md:flex-row overflow-hidden transform transition-transform duration-300 hover:-translate-y-2 hover:shadow-[0_26px_70px_rgba(0,0,0,0.8)]">
          <div className="flex-1 p-6 md:p-10 flex flex-col justify-center">
            <h3 className="text-white text-[18px] mb-2 font-semibold">
              Campus Access
            </h3>
            <p className="text-[#BBCABF] text-[16px] leading-6 mb-8">
              Sign in using your university email account to access lost and
              found services.
            </p>

            {/* Link ke halaman login */}
            <Link
              to="/login"
              className="bg-[#10B981] hover:bg-[#10B981]/80 text-white py-3 px-6 rounded-lg font-medium flex items-center justify-center gap-3"
            >
              <img
                src={Edu}
                alt="Education Icon"
                className="w-5 h-5 relative z-10"
              />
              Login with USU Email
            </Link>
          </div>

          <div className="flex-1 bg-linear-to-b from-[#164A41] to-[#0A241F] min-h-80 relative flex items-center justify-center overflow-hidden">
            <img
              src={Login}
              alt="Login Illustration"
              className="w-70 h-70 md:w-70 md:h-70 relative z-10 transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-linear-to-b from-[#164A41] to-[#0A241F] z-20 opacity-80" />
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-8 text-center border-t border-[#4D774E]/20 text-[#9DC88D] text-sm">
        ©2026 TemuBarang. All rights reserved.
      </footer>
    </div>
  );
}

export default LandingPage;
