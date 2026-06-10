"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { Printer, ArrowLeft, Loader2 } from "lucide-react";
import { getInquiryForPrint } from "@/lib/actions/inquiries";
import { toast } from "sonner";

function WaiverTemplateContent() {
    const searchParams = useSearchParams();
    const id = searchParams.get("id");
    const [loading, setLoading] = useState(!!id);
    const [inquiry, setInquiry] = useState<any>(null);
    const [discount, setDiscount] = useState<any>(null);

    useEffect(() => {
        if (id) {
            getInquiryForPrint(id)
                .then((res) => {
                    if (res.success && res.quote) {
                        setInquiry(res.quote);
                        if (res.discountDetails) {
                            setDiscount(res.discountDetails);
                        }
                        // Trigger print automatically after a short delay
                        setTimeout(() => {
                            window.print();
                        }, 1000);
                    } else {
                        toast.error(res.error || "Error loading appointment data.");
                    }
                })
                .catch((err) => {
                    console.error("Error loading print data:", err);
                    toast.error("Error loading appointment details.");
                })
                .finally(() => {
                    setLoading(false);
                });
        } else {
            // Blank template, trigger print automatically
            const timer = setTimeout(() => {
                window.print();
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [id]);

    const handleClose = () => {
        window.close();
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#111] text-white flex flex-col items-center justify-center gap-4">
                <Loader2 className="h-10 w-10 text-violet-500 animate-spin" />
                <p className="text-sm font-bold uppercase tracking-wider text-slate-400">Loading Contract Details...</p>
            </div>
        );
    }

    const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
    const formattedDate = inquiry?.appointmentDate
        ? new Date(inquiry.appointmentDate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
        : "";

    // Generate pets list - 2 empty pets if blank template, otherwise exact pets from reservation
    const petsList = inquiry
        ? (inquiry.pets || [])
        : [
              { name: "", breed: "", weightLbs: "", ageYears: "", rabiesVaccineUpToDate: false, rabiesRegistry: "", services: [] },
              { name: "", breed: "", weightLbs: "", ageYears: "", rabiesVaccineUpToDate: false, rabiesRegistry: "", services: [] }
          ];

    const price = inquiry ? (inquiry.finalAdminPrice || inquiry.systemEstimatedPrice) : null;

    return (
        <>
            {/* Custom Layout Override styles */}
            <style dangerouslySetInnerHTML={{__html: `
                /* Hide sidebar, header and layouts in admin panel (fallback) */
                aside, header, nav,
                div[class*="fixed bottom-4"], 
                div[class*="lg:hidden fixed"],
                .lg\\:hidden.fixed {
                    display: none !important;
                }
                
                @media print {
                    html, body {
                        overflow: visible !important;
                        height: auto !important;
                        background-color: white !important;
                        color: black !important;
                    }
                    
                    nav, header, aside, .no-print {
                        display: none !important;
                    }
                    
                    @page {
                        size: letter portrait;
                        margin: 0.35in 0.4in;
                    }
                    
                    .print-sheet {
                        box-shadow: none !important;
                        border: none !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        background: white !important;
                        width: 100% !important;
                        max-width: 100% !important;
                    }
                    
                    /* Prevent page break splitting within sections and cards */
                    .no-break, .internal-box, .pet-card {
                        page-break-inside: avoid !important;
                        break-inside: avoid !important;
                    }
                    
                    .section {
                        margin-bottom: 8px !important;
                    }
                }
                
                @media screen {
                    .print-sheet {
                        background: white;
                        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.08);
                        margin: 2rem auto;
                        padding: 2rem 3rem;
                        max-width: 800px;
                        border-radius: 8px;
                        border: 1px solid #e5e7eb;
                    }
                }

                .field-cell {
                    border-bottom: 1px solid #a3a3a3;
                    padding-bottom: 2px;
                    min-height: 26px;
                }
                .field-label {
                    display: block;
                    font-size: 7pt;
                    font-weight: 700;
                    text-transform: uppercase;
                    color: #525252;
                    margin-bottom: 1px;
                }
                .field-value {
                    font-size: 9pt;
                    font-weight: 700;
                    color: black;
                    min-height: 12pt;
                    display: block;
                }
                .price-box {
                    border: 2px solid black;
                    border-radius: 6px;
                    padding: 6px 12px;
                    display: inline-block;
                    font-size: 13pt;
                    font-weight: 900;
                    text-align: center;
                    background-color: white;
                }
                .terms-box {
                    border: 1px solid #d4d4d4;
                    border-radius: 6px;
                    padding: 6px 10px;
                    background-color: #fafafa;
                    font-size: 7.2pt;
                    line-height: 1.25;
                }
                .sig-line {
                    border-top: 1px solid black;
                    margin-top: 25px;
                    padding-top: 2px;
                }
                .sig-label {
                    font-size: 7pt;
                    font-weight: 700;
                    text-transform: uppercase;
                    color: #525252;
                }
                .internal-box {
                    border: 1.5pt dashed #a3a3a3;
                    border-radius: 8px;
                    padding: 10px 12px;
                    background-color: #fafafa;
                }
                .notes-underline {
                    border-bottom: 1px solid #e5e5e5;
                    display: block;
                    height: 16px;
                    margin-top: 6px;
                }
            `}} />

            {/* Floating toolbar for browser view */}
            <div className="no-print fixed top-4 right-4 flex items-center gap-3 bg-neutral-900/95 text-white p-2.5 rounded-xl shadow-2xl backdrop-blur-md z-50">
                <button
                    onClick={handleClose}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
                >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Back / Close
                </button>
                <button
                    onClick={() => window.print()}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 font-bold text-xs uppercase tracking-wider shadow-lg shadow-violet-900/20 transition-all cursor-pointer"
                >
                    <Printer className="h-3.5 w-3.5" />
                    Print / Save PDF
                </button>
            </div>

            <div className="flex flex-col font-sans select-none pb-8 print:pb-0">
                
                {/* ════════════════ UNIFIED SHEET ════════════════ */}
                <div className="print-sheet">
                    {/* Header */}
                    <div className="flex flex-col items-center text-center border-b-2 border-black pb-1 mb-2">
                        <div className="relative w-28 h-10 mb-0.5">
                            <Image
                                src="/Logo_groomersinc.svg"
                                alt="Groomers Inc Logo"
                                fill
                                className="object-contain"
                                priority
                                unoptimized
                            />
                        </div>
                        <h1 className="text-sm font-extrabold tracking-tight text-black mb-0.5 uppercase">
                            MOBILE GROOMING SERVICE AGREEMENT & LIABILITY WAIVER
                        </h1>
                        <p className="text-[9px] font-bold text-neutral-600 uppercase tracking-widest">
                            Miami, FL &bull; (786) 568-5000 &bull; groomersincpetspa@gmail.com
                        </p>
                    </div>

                    {/* Date and ID Strip */}
                    <div className="flex justify-between items-center text-[9px] font-bold text-neutral-500 mb-2.5 border-b border-neutral-200 pb-0.5">
                        <div>Date: {inquiry ? formattedDate : today}</div>
                        <div>Quote ID: {inquiry ? inquiry.id.substring(0, 8).toUpperCase() : "_________________"}</div>
                    </div>

                    {/* Section 1: Client & Service Destination */}
                    <div className="section no-break mb-3">
                        <h2 className="bg-neutral-100 px-2.5 py-0.5 text-[9.5px] font-black uppercase tracking-wider border border-black mb-1.5">
                            Section 1: Client & Service Destination
                        </h2>
                        <div className="grid grid-cols-2 gap-x-5 gap-y-2">
                            <div className="field-cell">
                                <span className="field-label">Client First & Last Name</span>
                                <span className="field-value">{inquiry?.ownerName || ""}</span>
                            </div>
                            <div className="field-cell">
                                <span className="field-label">Cell Phone</span>
                                <span className="field-value">{inquiry?.ownerPhone || ""}</span>
                            </div>
                            <div className="field-cell">
                                <span className="field-label">Email Address</span>
                                <span className="field-value">{inquiry?.ownerEmail || ""}</span>
                            </div>
                            <div className="field-cell">
                                <span className="field-label">Zip Code</span>
                                <span className="field-value">{inquiry?.zipCode || ""}</span>
                            </div>
                            <div className="col-span-2 field-cell">
                                <span className="field-label">Service Address (Miami, FL)</span>
                                <span className="field-value">
                                    {inquiry ? `${inquiry.address}, FL ${inquiry.zipCode}` : ""}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Sections 2 & 3: Pet Profiles, Services & Health Compliance */}
                    <div className="section mb-3">
                        <h2 className="bg-neutral-100 px-2.5 py-0.5 text-[9.5px] font-black uppercase tracking-wider border border-black mb-1">
                            Sections 2 & 3: Pet Profiles, Services & Health Compliance (FL Law)
                        </h2>
                        <p className="text-[8px] text-neutral-500 italic mb-1.5 leading-tight">
                            * Per Florida State Law, all dogs and cats must be vaccinated against Rabies. Owner certifies pets are fully vaccinated and agrees to provide proof upon request.
                        </p>

                        <div className="space-y-2.5">
                            {petsList.map((pet: any, idx: number) => {
                                const servicesText = pet.services?.map((s: any) => s.nameEn).join(", ") || "";
                                return (
                                    <div key={idx} className="pet-card border border-neutral-300 rounded-lg p-2.5 bg-neutral-50/50">
                                        <h3 className="text-[9px] font-black text-black uppercase tracking-wider mb-1.5 pb-0.5 border-b border-neutral-200">
                                            Pet #{idx + 1} {pet.name ? `— ${pet.name.toUpperCase()}` : ""}
                                        </h3>
                                        <div className="grid grid-cols-2 gap-x-5 gap-y-2">
                                            <div className="field-cell">
                                                <span className="field-label">Pet Name</span>
                                                <span className="field-value">{pet.name || ""}</span>
                                            </div>
                                            <div className="field-cell">
                                                <span className="field-label">Breed</span>
                                                <span className="field-value">{pet.breed || ""}</span>
                                            </div>
                                            <div className="field-cell">
                                                <span className="field-label">Weight (lbs)</span>
                                                <span className="field-value">
                                                    {pet.weightLbs ? `${pet.weightLbs} lbs` : ""}
                                                </span>
                                            </div>
                                            <div className="field-cell">
                                                <span className="field-label">Age</span>
                                                <span className="field-value">
                                                    {pet.ageYears ? `${pet.ageYears} years` : ""}
                                                </span>
                                            </div>
                                            <div className="col-span-2 field-cell">
                                                <span className="field-label">Requested Services</span>
                                                <span className="field-value text-[8pt]">{servicesText}</span>
                                            </div>
                                            <div className="field-cell">
                                                <span className="field-label">Rabies Vaccine Exp. Date</span>
                                                <span className="field-value text-[7.5pt] font-mono text-neutral-600">
                                                    {inquiry 
                                                        ? (pet.rabiesVaccineUpToDate ? `VACCINATED | Registry #: ${pet.rabiesRegistry || "N/A"}` : "NOT VERIFIED — Proof Required")
                                                        : "MM / DD / 20___"}
                                                </span>
                                            </div>
                                            <div className="field-cell">
                                                <span className="field-label">Groomer Initials (Proof Verified)</span>
                                                <span className="field-value"></span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Section 3 (cont.): Grooming Estimate & Special Instructions */}
                    <div className="section no-break mb-3">
                        <h2 className="bg-neutral-100 px-2.5 py-0.5 text-[9.5px] font-black uppercase tracking-wider border border-black mb-1.5">
                            Section 3 (cont.): Grooming Estimate & Special Instructions
                        </h2>
                        <div className="grid grid-cols-3 gap-5">
                            <div className="col-span-1 flex flex-col justify-start">
                                <span className="field-label mb-1">Total Estimated Spa Price</span>
                                <div className="price-box">
                                    {price ? `$ ${price.toFixed(2)}` : "$ ___________"}
                                </div>
                                {inquiry?.discountCode && (
                                    <div className="text-[8px] font-bold text-violet-600 mt-1 uppercase tracking-wider">
                                        Coupon: {inquiry.discountCode} {discount ? `(${discount.discount} Off)` : ""}
                                    </div>
                                )}
                            </div>
                            <div className="col-span-2 field-cell flex flex-col justify-between">
                                <span className="field-label">Specific Instructions (Haircut style, length, sensitive areas)</span>
                                <span className="field-value text-[8pt] leading-snug">{inquiry?.message || ""}</span>
                            </div>
                        </div>
                    </div>

                    {/* Section 4: Terms & Conditions */}
                    <div className="section no-break mb-3">
                        <h2 className="bg-neutral-100 px-2.5 py-0.5 text-[9.5px] font-black uppercase tracking-wider border border-black mb-1.5">
                            Section 4: Terms & Conditions
                        </h2>
                        <div className="terms-box">
                            <ol className="list-decimal pl-3.5 space-y-0.5 text-neutral-700 font-medium">
                                <li>
                                    <strong className="text-black uppercase">Matted Coat Policy:</strong> Mats can cause severe skin irritation, trapping moisture and bacteria. Shaving a heavily matted coat is the only humane option and exposes pre-existing skin conditions. Groomers Inc is not liable for nicks, cuts, or irritation resulting from grooming of matted pets.
                                </li>
                                <li>
                                    <strong className="text-black uppercase">Behavior & Safety:</strong> The owner must inform the groomer if the pet has aggressive tendencies. Groomers Inc reserves the right to refuse or stop service at any time for the safety of the groomer and the pet. If the pet requires muzzling or extra handling, additional fees may apply.
                                </li>
                                <li>
                                    <strong className="text-black uppercase">Payment Terms:</strong> Payment is due immediately upon completion of the service. We operate on a cash-only basis unless pre-arranged. A $50 fee will be charged for any appointments cancelled with less than 24 hours notice.
                                </li>
                                <li>
                                    <strong className="text-black uppercase">Liability Waiver:</strong> Owner releases Groomers Inc from liability for injury, illness, or damage arising from standard grooming procedures or sudden health events during spa sessions.
                                </li>
                            </ol>
                        </div>
                    </div>

                    {/* Section 5: Signatures & Agreements */}
                    <div className="section no-break mb-3">
                        <h2 className="bg-neutral-100 px-2.5 py-0.5 text-[9.5px] font-black uppercase tracking-wider border border-black mb-1.5">
                            Section 5: Signatures & Agreements
                        </h2>
                        
                        <div className="text-[9px] text-neutral-600 mb-2 leading-tight">
                            By signing below, I acknowledge that I have read and agree to all terms and policies listed in Section 4. 
                            I authorize Groomers, INC. to perform the requested grooming services on my pet(s).
                        </div>

                        <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                            <div>
                                <div className="sig-line">
                                    <span className="sig-label">Client Signature</span>
                                </div>
                                <div className="sig-line">
                                    <span className="sig-label">Date</span>
                                </div>
                            </div>
                            <div>
                                <div className="sig-line">
                                    <span className="sig-label">Spa Groomer Signature</span>
                                </div>
                                <div className="sig-line">
                                    <span className="sig-label">Date</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer (Internal Use Only) */}
                    <div className="section no-break">
                        <div className="internal-box">
                            <span className="internal-label text-[7.5pt] mb-1">For Internal Use Only</span>
                            <div className="grid grid-cols-3 gap-5 items-end mb-2.5">
                                <div className="col-span-1 text-[8.5pt] font-bold text-neutral-700 flex flex-col gap-0.5">
                                    <span>Service Completed?</span>
                                    <div className="flex gap-3 font-mono text-[9pt] text-black">
                                        <span>[&nbsp;&nbsp;] YES</span>
                                        <span>[&nbsp;&nbsp;] NO</span>
                                    </div>
                                </div>
                                <div className="col-span-2 border-b border-neutral-400 pb-1">
                                    <span className="field-label">Final Cash Received</span>
                                    <div className="text-[9pt] font-black text-black">$ ___________________________</div>
                                </div>
                            </div>
                            <div className="text-[8.5pt] font-bold text-neutral-700">
                                <span>Groomer Notes & Observations:</span>
                                <div className="space-y-0.5">
                                    <span className="notes-underline"></span>
                                    <span className="notes-underline"></span>
                                    <span className="notes-underline"></span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </>
    );
}

export default function WaiverTemplatePage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-[#111] text-white flex flex-col items-center justify-center gap-4">
                <Loader2 className="h-10 w-10 text-violet-500 animate-spin" />
                <p className="text-sm font-bold uppercase tracking-wider text-slate-400">Loading Layout...</p>
            </div>
        }>
            <WaiverTemplateContent />
        </Suspense>
    );
}
