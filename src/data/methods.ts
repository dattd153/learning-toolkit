export type GoalId = "hieu" | "nho" | "taptrung" | "sapxep" | "tranh";
export type GoalFilter = "all" | GoalId;
export type Evidence = "manh" | "tb" | "han" | "kem";
export type ToolTab = "cards" | "feynman" | "palace" | "pomo";

export interface Method {
  name: string;
  en: string;
  goal: GoalId[];
  ev: Evidence;
  what: string;
  steps: string[];
  tip: string;
  tool?: ToolTab;
}

export const GOALS: Record<GoalFilter, string> ={all:"Tất cả",hieu:"Hiểu sâu",nho:"Nhớ lâu",taptrung:"Tập trung",sapxep:"Sắp xếp kiến thức",tranh:"Nên tránh"};
export const EV: Record<Evidence, string> ={manh:"Bằng chứng mạnh",tb:"Bằng chứng vừa",han:"Ít bằng chứng",kem:"Hiệu quả thấp"};
export const METHODS: Method[] =[
 {name:"Gợi nhớ chủ động",en:"Active recall",goal:["nho"],ev:"manh",
  what:"Tự kiểm tra bằng cách lấy thông tin ra khỏi đầu, thay vì đọc lại.",
  steps:["Đọc xong một phần, gập sách lại.","Viết hoặc nói ra mọi thứ bạn nhớ được.","Mở sách đối chiếu, đánh dấu chỗ thiếu.","Biến các ý chính thành câu hỏi để tự hỏi lần sau."],
  tip:"Cảm giác khó khăn khi cố nhớ chính là lúc trí nhớ đang được củng cố. Đọc lại thấy dễ nhưng quên nhanh.",tool:"cards"},
 {name:"Lặp lại ngắt quãng",en:"Spaced repetition",goal:["nho"],ev:"manh",
  what:"Ôn lại với khoảng cách tăng dần, đúng lúc sắp quên.",
  steps:["Học lần đầu.","Ôn sau 1 ngày, rồi 3 ngày, 1 tuần, 2 tuần, 1 tháng.","Thứ nào quên thì quay lại khoảng cách ngắn.","Chia nhỏ: 20 phút mỗi ngày hiệu quả hơn 3 tiếng một lần."],
  tip:"Kết hợp với gợi nhớ chủ động (dùng thẻ nhớ) để có hiệu quả cao nhất.",tool:"cards"},
 {name:"Kỹ thuật Feynman",en:"Feynman technique",goal:["hieu"],ev:"tb",
  what:"Giải thích lại bằng lời đơn giản để lộ ra chỗ mình chưa hiểu.",
  steps:["Chọn một khái niệm.","Giải thích như dạy một đứa trẻ.","Tìm chỗ bí, quay lại tài liệu.","Rút gọn và thêm ví dụ, phép so sánh."],
  tip:"Dựa trên hiệu ứng tự giải thích và hiệu ứng người dạy, cả hai đều được nghiên cứu ủng hộ.",tool:"feynman"},
 {name:"Diễn giải chi tiết",en:"Elaborative interrogation",goal:["hieu","nho"],ev:"tb",
  what:"Liên tục hỏi \"Tại sao?\" và \"Như thế nào?\" rồi tự trả lời.",
  steps:["Với mỗi sự kiện, hỏi: vì sao điều này đúng?","Nối kiến thức mới với điều bạn đã biết.","So sánh: cái này giống và khác cái kia thế nào?"],
  tip:"Hiệu quả nhất khi bạn đã có chút nền tảng về chủ đề."},
 {name:"Học xen kẽ",en:"Interleaving",goal:["hieu"],ev:"tb",
  what:"Trộn nhiều dạng bài hoặc chủ đề trong một buổi thay vì làm hết một dạng rồi mới sang dạng khác.",
  steps:["Chọn 2–3 dạng bài liên quan (ví dụ: tính diện tích các hình khác nhau).","Làm xen kẽ: A, B, C, B, A, C...","Trước mỗi bài, tự hỏi: đây là dạng nào, dùng cách gì?"],
  tip:"Lúc đầu sẽ thấy chậm và khó hơn, nhưng kết quả kiểm tra sau đó tốt hơn rõ rệt, nhất là với toán."},
 {name:"Mã hoá kép",en:"Dual coding",goal:["hieu","nho"],ev:"tb",
  what:"Kết hợp chữ với hình: sơ đồ, đường thời gian, biểu đồ, hình vẽ.",
  steps:["Đọc phần chữ.","Tự vẽ lại thành sơ đồ hoặc hình minh hoạ.","Giải thích hình bằng lời, và ngược lại."],
  tip:"Không cần vẽ đẹp. Quan trọng là chính bạn chuyển đổi giữa chữ và hình."},
 {name:"Cung điện ký ức",en:"Method of loci",goal:["nho"],ev:"manh",
  what:"Gắn từng thứ cần nhớ vào các vị trí trên một lộ trình quen thuộc.",
  steps:["Chọn một nơi bạn thuộc lòng.","Xác định các điểm dừng theo thứ tự.","Đặt mỗi mục vào một điểm bằng hình ảnh kỳ quặc, phóng đại.","Đi lại lộ trình trong đầu để nhớ."],
  tip:"Rất mạnh với danh sách có thứ tự (bài phát biểu, các bước, dãy số). Ít phù hợp để hiểu khái niệm.",tool:"palace"},
 {name:"Câu thần chú, viết tắt",en:"Mnemonics",goal:["nho"],ev:"han",
  what:"Biến danh sách khó nhớ thành câu vui, dễ đọc.",
  steps:["Lấy chữ cái đầu của từng mục.","Ghép thành một câu có nghĩa, càng buồn cười càng tốt.","Đọc to vài lần."],
  tip:"Ví dụ quen thuộc: dãy hoạt động kim loại K, Na, Ca, Mg, Al, Zn, Fe... thành \"Khi Nào Cần May Áo Giáp Sắt...\"; hay \"Sin đi học, Cos không hư, Tan đoàn kết, Cot kết đoàn\". Tốt cho dữ kiện rời rạc, không thay được việc hiểu bài."},
 {name:"Chia nhỏ thông tin",en:"Chunking",goal:["nho","sapxep"],ev:"tb",
  what:"Gom các mẩu nhỏ thành nhóm có nghĩa để trí nhớ ngắn hạn chứa được nhiều hơn.",
  steps:["Tìm quy luật hoặc nhóm tự nhiên trong thông tin.","Đặt tên cho mỗi nhóm.","Học từng nhóm, rồi ghép lại."],
  tip:"Số điện thoại 0912345678 dễ nhớ hơn khi tách thành 0912 345 678."},
 {name:"Sơ đồ tư duy",en:"Mind map",goal:["sapxep","hieu"],ev:"tb",
  what:"Vẽ chủ đề ở giữa, các ý chính toả ra thành nhánh.",
  steps:["Viết chủ đề ở giữa trang.","Vẽ các nhánh lớn cho ý chính.","Thêm nhánh nhỏ, từ khoá, hình vẽ.","Nối các nhánh có liên quan với nhau."],
  tip:"Hiệu quả nhất khi bạn tự vẽ từ trí nhớ rồi mới đối chiếu với sách."},
 {name:"Ghi chép Cornell",en:"Cornell notes",goal:["sapxep"],ev:"han",
  what:"Chia trang thành cột ghi chép, cột câu hỏi gợi ý và phần tóm tắt.",
  steps:["Chia trang: cột phải rộng để ghi bài, cột trái hẹp, dải dưới cùng.","Trong giờ học, ghi ở cột phải.","Sau giờ học, viết câu hỏi vào cột trái.","Tóm tắt cả trang trong 2–3 câu ở dưới.","Che cột phải, nhìn câu hỏi để tự trả lời."],
  tip:"Bản thân cách chia trang ít được nghiên cứu, nhưng bước che cột để tự hỏi chính là gợi nhớ chủ động."},
 {name:"Pomodoro",en:"Pomodoro",goal:["taptrung"],ev:"han",
  what:"Học tập trung 25 phút, nghỉ 5 phút, lặp lại.",
  steps:["Chọn một việc cụ thể.","Đặt giờ 25 phút, tắt thông báo.","Nghỉ 5 phút, đứng dậy đi lại.","Sau 4 phiên, nghỉ 15–30 phút."],
  tip:"Ít nghiên cứu trực tiếp, nhưng giúp chống trì hoãn và tạo nhịp nghỉ đều đặn. Có thể chỉnh 50/10 nếu hợp hơn.",tool:"pomo"},
 {name:"Ôn đến khi nhớ được",en:"Successive relearning",goal:["nho"],ev:"manh",
  what:"Mỗi buổi ôn, tự nhớ lại cho đến khi trả lời đúng từng ý, rồi lặp lại buổi ôn đó qua nhiều ngày.",
  steps:["Chuẩn bị câu hỏi hoặc thẻ nhớ cho phần cần thuộc.","Tự trả lời từng câu. Sai câu nào thì xem đáp án rồi đưa câu đó xuống cuối hàng.","Chỉ dừng khi mọi câu đều đã trả lời đúng ít nhất một lần (muốn chắc hơn: ba lần).","Lặp lại cả quy trình sau vài ngày, thường 3–5 buổi."],
  tip:"Đây là gợi nhớ chủ động cộng lặp lại ngắt quãng. Buổi sau nhanh hơn hẳn buổi đầu, đó là dấu hiệu trí nhớ đang bền lên. Phiên ôn thẻ trong ứng dụng này làm đúng như vậy: thẻ bấm Quên sẽ quay lại cuối hàng đợi.",tool:"cards"},
 {name:"Học qua bài giải mẫu",en:"Worked examples",goal:["hieu"],ev:"manh",
  what:"Người mới học xem kỹ lời giải mẫu từng bước trước, rồi bớt dần gợi ý cho đến khi tự giải được.",
  steps:["Đọc một bài giải mẫu, hiểu vì sao có từng bước.","Làm một bài tương tự, che bước cuối của lời giải và tự làm phần đó.","Bài tiếp theo, che nhiều bước hơn.","Đến khi tự giải trọn vẹn được một bài mới."],
  tip:"Hiệu quả nhất với người mới, vì đầu óc không bị quá tải khi vừa phải tìm cách giải vừa phải học kiến thức. Khi đã thạo thì chuyển sang tự giải: lúc đó đọc lời giải mẫu lại làm chậm tiến bộ."},
 {name:"Đoán trước khi học",en:"Pretesting",goal:["nho","hieu"],ev:"tb",
  what:"Thử trả lời câu hỏi về bài trước khi học, kể cả khi chưa biết gì.",
  steps:["Trước khi đọc chương mới, xem câu hỏi cuối chương hoặc tự đặt 3–5 câu hỏi từ các tiêu đề.","Viết ra câu trả lời đoán, đừng bỏ trống.","Học bài, để ý tìm đáp án cho các câu đã đoán.","So đáp án đúng với lời đoán của mình."],
  tip:"Đoán sai không sao: chính việc đoán khiến bạn chú ý và nhớ đáp án đúng tốt hơn. Chỉ cần xem lại đáp án đúng ngay sau đó."},
 {name:"Tự giải thích từng bước",en:"Self-explanation",goal:["hieu"],ev:"tb",
  what:"Khi đọc lời giải hoặc làm bài, dừng ở mỗi bước để tự giải thích vì sao bước đó đúng.",
  steps:["Đọc một bước trong lời giải hoặc bài làm.","Tự hỏi: bước này dùng quy tắc gì, vì sao làm vậy?","Nói hoặc viết câu trả lời bằng lời của mình.","Nối với bước trước: bước này dựa vào kết quả nào?"],
  tip:"Kỹ thuật Feynman giải thích cả một khái niệm, còn cách này đi vào từng bước nhỏ. Rất hợp với Toán, Lý, Hoá. Có thể dùng Bàn Feynman để ghi lại lời giải thích.",tool:"feynman"},
 {name:"Lập kế hoạch \"Nếu… thì…\"",en:"Implementation intentions",goal:["taptrung"],ev:"tb",
  what:"Gắn việc học với một tình huống cụ thể trong ngày, thay vì chỉ đặt mục tiêu chung chung.",
  steps:["Chọn việc học cụ thể: ôn 20 thẻ, làm 5 bài tập.","Chọn một tình huống có sẵn mỗi ngày: ăn tối xong, vừa về đến nhà.","Viết thành câu: \"Nếu [tình huống] thì mình sẽ [việc học]\".","Lường trước trở ngại: \"Nếu muốn cầm điện thoại thì mình để nó sang phòng khác\"."],
  tip:"Kế hoạch dạng này giúp bắt tay vào làm mà không cần đợi có hứng. Kết hợp với Pomodoro: \"Nếu ăn tối xong thì mình bấm Bắt đầu một phiên.\"",tool:"pomo"},
 {name:"Đọc lại nhiều lần",en:"Rereading",goal:["tranh"],ev:"kem",
  what:"Đọc đi đọc lại tài liệu. Cảm giác quen mặt chữ rất dễ bị nhầm thành đã nhớ.",
  steps:["Đọc một lần, gập sách và tự viết ra những gì nhớ được.","Biến các ý chính thành thẻ nhớ.","Chỉ mở lại sách để kiểm tra chỗ nhớ sai hoặc còn thiếu."],
  tip:"Đọc lại thấy nhẹ nhàng nên rất dễ thành thói quen. Nhưng với cùng thời gian đó, tự kiểm tra giúp nhớ lâu hơn nhiều.",tool:"cards"},
 {name:"Tô đậm, gạch chân",en:"Highlighting",goal:["tranh"],ev:"kem",
  what:"Tô màu hoặc gạch chân đoạn quan trọng. Thường tô quá nhiều và dừng lại ở đó.",
  steps:["Đọc hết một đoạn rồi mới đánh dấu, mỗi đoạn chỉ một ý.","Viết ý đó thành câu hỏi bên lề.","Khi ôn, che phần đã đánh dấu và trả lời câu hỏi."],
  tip:"Đánh dấu không có hại, nhưng chỉ tô màu rồi đọc lại thì gần như không giúp nhớ thêm. Giá trị nằm ở bước biến chỗ đánh dấu thành câu hỏi."},
 {name:"Tóm tắt khi đang nhìn sách",en:"Summarization",goal:["tranh"],ev:"kem",
  what:"Viết bản tóm tắt trong lúc mở sách. Nếu chưa biết cách tóm tắt tốt, việc này dễ thành chép lại cho ngắn hơn.",
  steps:["Gập sách trước khi tóm tắt, viết từ trí nhớ.","Dùng lời của mình, tối đa 3–5 câu cho mỗi phần.","Mở sách đối chiếu và bổ sung chỗ thiếu."],
  tip:"Gập sách rồi mới tóm tắt thì việc tóm tắt trở thành gợi nhớ chủ động, và hiệu quả hơn hẳn."}
];


export const TOOL_NAME: Record<ToolTab, string> = {
  cards: "Mở thẻ nhớ",
  feynman: "Mở bàn Feynman",
  palace: "Mở cung điện ký ức",
  pomo: "Mở đồng hồ Pomodoro",
};

/** "Tất cả" shows recommended methods only; the avoid list has its own filter. */
export const inGoal = (m: Method, g: GoalFilter) =>
  g === "all" ? !m.goal.includes("tranh") : m.goal.includes(g);
