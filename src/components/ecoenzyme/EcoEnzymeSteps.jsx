"use client"

import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Lock, Wind, Utensils, Droplet, Archive } from "lucide-react"; 

const steps = [
    { icon: <Archive className="text-yellow-600" />, title: "Siapkan Wadah", desc: "Gunakan wadah plastik kedap udara (3/5 penuh). Hindari kaca karena akan menghasilkan gas." },
    { icon: <Droplet className="text-blue-500" />, title: "Campur Gula & Air", desc: "Masukkan air dan gula merah sesuai takaran (rasio 10:1). Lalu aduk hingga rata." },
    { icon: <Utensils className="text-green-600" />, title: "Masukkan Sampah", desc: "Tambahkan sisa buah/sayur mentah. (Rasio 3:1 terhadap gula). Hindari yang sudah dimasak atau berminyak." },
    { icon: <Lock className="text-orange-500" />, title: "Tutup & Simpan", desc: "Tutup rapat, beri label tanggal dan simpan di tempat yang sejuk dan gelap." },
    { icon: <Wind className="text-gray-500" />, title: "Lepas Gas", desc: "Pada minggu pertama, buka tutup wadah setiap hari untuk melepas gas fermentasi." },
    { icon: <CheckCircle className="text-purple-600" />, title: "Panen!", desc: "Setelah 90 hari (3 bulan) Eco Enzyme Anda siap digunakan!" },
];

export default function EcoEnzymeSteps() {
    return (
        <div className="mt-4 sm:mt-6">
            <Card>
                <CardContent className="p-3 sm:p-4 md:p-6">
                    <h3 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 md:mb-6 text-gray-900 text-center">
                        Langkah Pembuatan Eco Enzyme
                    </h3>
                    <div className="space-y-3 sm:space-y-4"> 
                        {steps.map((s, i) => (
                            <div key={i} className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-start p-3 sm:p-4 bg-white border border-gray-200 rounded-lg shadow-sm transition-all duration-300 hover:shadow-md group">
                                {/* Ikon */}
                                <div className="text-2xl sm:text-3xl flex-shrink-0 pt-0.5 transition-transform duration-300 group-hover:scale-110">
                                    {s.icon} 
                                </div>
                                {/* Judul dan Deskripsi */}
                                <div>
                                    <h4 className="font-bold text-base sm:text-lg text-gray-800">
                                        {i + 1}. {s.title}
                                    </h4>
                                    <p className="text-xs sm:text-sm text-gray-600 mt-0.5">
                                        {s.desc}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}