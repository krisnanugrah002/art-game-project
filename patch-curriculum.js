const fs = require('fs');

const data = JSON.parse(fs.readFileSync('content/curriculum.json', 'utf8'));

data.stages.forEach(stage => {
  stage.chapters.forEach(ch => {
    const minigame = ch.minigame;
    if (!minigame) return;

    if (minigame.type === 'tap_match') {
      minigame.config = {
        prompt: "Pilih garis yang benar!",
        items: [
          { id: "1", label: "Garis Zigzag", correct: true },
          { id: "2", label: "Garis Lengkung", correct: true },
          { id: "3", label: "Lingkaran Penuh", correct: false },
          { id: "4", label: "Kotak", correct: false }
        ]
      };
    } else if (minigame.type === 'drag_sort' && minigame.title === 'Sortir Kilat') {
      minigame.config = {
        categories: ["Geometris", "Organik"],
        items: [
          { id: "1", label: "Kotak Korek", target: "Geometris" },
          { id: "2", label: "Daun Kering", target: "Organik" },
          { id: "3", label: "Bola Pingpong", target: "Geometris" },
          { id: "4", label: "Awan", target: "Organik" }
        ]
      };
    } else if (minigame.type === 'hotspot_find') {
      minigame.config = {
        prompt: "Pilih contoh Titik di alam sekitar!",
        items: [
          { id: "1", label: "Bintang di Langit Malam", correct: true },
          { id: "2", label: "Garis Batas Cakrawala", correct: false },
          { id: "3", label: "Butiran Pasir", correct: true },
          { id: "4", label: "Bidang Tembok", correct: false }
        ]
      };
    } else if (minigame.type === 'shape_builder' && minigame.title === 'Rakit Monster') {
      minigame.config = {
        prompt: "Pilih kepingan untuk merakit Monster Berkepala Bulat!",
        items: [
          { id: "1", label: "+ Kepala Bulat", correct: true },
          { id: "2", label: "+ Kepala Segitiga", correct: false },
          { id: "3", label: "+ 2 Mata", correct: true },
          { id: "4", label: "+ Badan Lingkaran", correct: true }
        ]
      };
    } else if (minigame.type === 'color_mixer') {
      minigame.config = {
        target: { name: 'Hijau (Campur Biru & Kuning)', hex: '#22c55e' }
      };
    } else if (minigame.type === 'memory_match') {
      minigame.config = {
        cards: [
          { id: "1", content: "Merah", pairId: "A" },
          { id: "2", content: "Hijau", pairId: "A" }, 
          { id: "3", content: "Biru", pairId: "B" },
          { id: "4", content: "Oranye", pairId: "B" }, 
          { id: "5", content: "Kuning", pairId: "C" },
          { id: "6", content: "Ungu", pairId: "C" }
        ]
      };
    } else if (minigame.type === 'swipe_cards' && minigame.title === 'Termometer Warna') {
      minigame.config = {
        leftLabel: "Warna Dingin",
        rightLabel: "Warna Hangat",
        cards: [
          { id: "1", label: "Api Merah", target: "right" },
          { id: "2", label: "Lautan Biru", target: "left" },
          { id: "3", label: "Matahari Kuning", target: "right" },
          { id: "4", label: "Daun Hijau", target: "left" }
        ]
      };
    } else if (minigame.type === 'palette_pick') {
      minigame.config = {
        prompt: "Mana yang merupakan contoh harmoni Monokromatik?",
        items: [
          { id: "1", label: "Merah Tua, Merah Muda, Merah Pastel", correct: true },
          { id: "2", label: "Merah, Kuning, Biru", correct: false },
          { id: "3", label: "Biru Laut, Biru Langit, Navy", correct: true }
        ]
      };
    } else if (minigame.type === 'gradient_sort') {
      minigame.config = {
        categories: ["Terang", "Sedang", "Gelap"],
        items: [
          { id: "1", label: "Putih", target: "Terang" },
          { id: "2", label: "Hitam", target: "Gelap" },
          { id: "3", label: "Abu-abu Sedang", target: "Sedang" },
          { id: "4", label: "Abu-abu Tua", target: "Gelap" }
        ]
      };
    } else if (minigame.type === 'texture_match') {
      minigame.config = {
        prompt: "Mana tekstur yang Nyata (bisa diraba)?",
        items: [
          { id: "1", label: "Kulit Kayu Pohon Jati", correct: true },
          { id: "2", label: "Foto Pasir di Layar HP", correct: false },
          { id: "3", label: "Karpet Bulu", correct: true },
          { id: "4", label: "Gambar Bebatuan", correct: false }
        ]
      };
    } else if (minigame.type === 'pattern_complete') {
      minigame.config = {
        categories: ["Organik/Batik", "Geometris Kaku"],
        items: [
          { id: "1", label: "Motif Parang", target: "Organik/Batik" },
          { id: "2", label: "Motif Kotak Papan Catur", target: "Geometris Kaku" },
          { id: "3", label: "Motif Daun Sirih", target: "Organik/Batik" }
        ]
      };
    } else if (minigame.type === 'shape_builder' && minigame.title === 'Desain Poster') {
      minigame.config = {
        prompt: "Pilih elemen yang membuat poster SEIMBANG & JELAS!",
        items: [
          { id: "1", label: "Judul Besar di Atas (Fokus)", correct: true },
          { id: "2", label: "Teks Menumpuk Acak", correct: false },
          { id: "3", label: "Gambar Utama di Tengah", correct: true },
          { id: "4", label: "Warna Latar Terlalu Mencolok", correct: false }
        ]
      };
    } else if (minigame.type === 'layer_stack') {
      minigame.config = {
        categories: ["Latar Belakang", "Latar Depan"],
        items: [
          { id: "1", label: "Gunung di Kejauhan", target: "Latar Belakang" },
          { id: "2", label: "Bunga Besar Menutupi Layar", target: "Latar Depan" },
          { id: "3", label: "Awan dan Langit", target: "Latar Belakang" },
          { id: "4", label: "Pagar di Depan Penonton", target: "Latar Depan" }
        ]
      };
    } else if (minigame.type === 'depth_swipe') {
      minigame.config = {
        leftLabel: "Jauh (Pudar)",
        rightLabel: "Dekat (Jelas)",
        cards: [
          { id: "1", label: "Pohon Berkabut Biru", target: "left" },
          { id: "2", label: "Batu Bertekstur Tajam", target: "right" },
          { id: "3", label: "Gunung Samar-samar", target: "left" },
          { id: "4", label: "Daun Detail", target: "right" }
        ]
      };
    } else if (minigame.type === 'timeline_sort') {
      minigame.config = {
        categories: ["Prasejarah (Kuno)", "Modern"],
        items: [
          { id: "1", label: "Lukisan Gua Leang-Leang", target: "Prasejarah (Kuno)" },
          { id: "2", label: "Gaya Kubisme (Picasso)", target: "Modern" },
          { id: "3", label: "Batu Ukiran Purba", target: "Prasejarah (Kuno)" },
          { id: "4", label: "Impresionisme Perancis", target: "Modern" }
        ]
      };
    } else if (minigame.type === 'who_painted') {
      minigame.config = {
        prompt: "Siapakah pelukis Mona Lisa?",
        items: [
          { id: "1", label: "Leonardo Da Vinci", correct: true },
          { id: "2", label: "Vincent Van Gogh", correct: false },
          { id: "3", label: "Raden Saleh", correct: false },
          { id: "4", label: "Michelangelo", correct: false }
        ]
      };
    } else if (minigame.type === 'swipe_cards' && minigame.title === 'Tebak Gaya') {
      minigame.config = {
        leftLabel: "Impresionisme",
        rightLabel: "Kubisme",
        cards: [
          { id: "1", label: "Bentuk Terpecah-pecah Kotak", target: "right" },
          { id: "2", label: "Sapuan Cahaya Alam Lembut", target: "left" },
          { id: "3", label: "Wajah Menjadi Segitiga", target: "right" },
          { id: "4", label: "Menitikberatkan pada pantulan cahaya", target: "left" }
        ]
      };
    } else if (minigame.type === 'map_drag') {
      minigame.config = {
        categories: ["Jawa", "Papua"],
        items: [
          { id: "1", label: "Wayang Kulit", target: "Jawa" },
          { id: "2", label: "Ukiran Asmat", target: "Papua" },
          { id: "3", label: "Batik Pekalongan", target: "Jawa" },
          { id: "4", label: "Patung Kamoro", target: "Papua" }
        ]
      };
    } else if (minigame.type === 'marathon_quiz') {
      minigame.config = {
        prompt: "Pilih SEMUA pernyataan yang BENAR untuk lulus!",
        items: [
          { id: "1", label: "Biru adalah warna primer", correct: true },
          { id: "2", label: "Rule of Thirds meletakkan objek di pojok layar", correct: false },
          { id: "3", label: "Hijau adalah campuran Biru dan Kuning", correct: true },
          { id: "4", label: "Garis diagonal memberi kesan diam", correct: false },
          { id: "5", label: "Impresionisme mengutamakan efek cahaya", correct: true }
        ]
      };
    }
  });
});

fs.writeFileSync('content/curriculum.json', JSON.stringify(data, null, 2));
console.log('Patch complete!');
