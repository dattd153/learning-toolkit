import { ReviewSession } from "./ReviewSession";
import { AddCards } from "./AddCards";
import { DeckManager } from "./DeckManager";
import { CardList } from "./CardList";

export function CardsPanel() {
  return (
    <>
      <div className="panel-head">
        <h2>Thẻ nhớ ôn ngắt quãng</h2>
        <p className="lede">
          Lịch ôn dùng thuật toán FSRS: mỗi thẻ có độ khó và độ bền trí nhớ riêng, được hẹn ôn đúng lúc bạn sắp quên. Tự
          nhớ lại trước khi lật thẻ là phần quan trọng nhất, rồi chấm trung thực: Quên, Khó, Nhớ hoặc Dễ.
        </p>
      </div>
      <div className="cols">
        <div className="stack">
          <div className="card">
            <ReviewSession />
          </div>
          <AddCards />
        </div>
        <DeckManager />
      </div>
      <CardList />
    </>
  );
}
