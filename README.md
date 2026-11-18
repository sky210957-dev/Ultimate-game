# 🎮 Multi-Game Hub Ultimate

เว็บเกมรวม **11 เกม** ที่อัปเกรดให้สมจริงเหมือนเกมระดับมืออาชีพ

## เกมที่มี

| เกม | โหมด | ฟีเจอร์เด่น |
|-----|------|-------------|
| Tic-Tac-Toe | บอท/เพื่อน | Minimax + Alpha-Beta |
| Battleship | บอท/เพื่อน | ลากวางเรือ + AI Probability |
| Connect 4 | บอท/เพื่อน | Minimax Depth 4 |
| Memory Match | บอท/เพื่อน | 3D Flip + AI Memory |
| Rock Paper Scissors | บอท/เพื่อน | Markov Chain |
| Checkers | บอท/เพื่อน | บังคับ Multi-jump + Minimax |
| Chess | บอท/เพื่อน | 8x8 มาตรฐาน + Castling + En Passant |
| Sudoku | เดี่ยว | Pencil Mode + ไฮไลต์ |
| 2048 | เดี่ยว | Undo + Animation |
| Block Blast | เก็บแต้ม | Preview + Combo Multiplier |
| Fruit Ninja | เก็บแต้ม | ปาดฟัน + Combo |

## วิธีรัน

### ❗ สำคัญ: ต้องรันผ่าน local server (ไม่ใช่ double-click)
เพราะใช้ ES Modules ซึ่งเบราว์เซอร์บล็อก `file://`

**วิธีที่ 1: Python**
```bash
python -m http.server 8000
# เปิด http://localhost:8000
