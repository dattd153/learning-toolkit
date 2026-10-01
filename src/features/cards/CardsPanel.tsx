import { ReviewSession } from "./ReviewSession";
import { AddCards } from "./AddCards";
import { BoxChart } from "./BoxChart";
import { CardList } from "./CardList";

export function CardsPanel({ active }: { active: boolean }) {
  return (
    <>
      <div className="panel-head">
        <h2>Thẻ nhớ ôn ngắt quãng</h2>
        <p className="lede">
          Hệ thống hộp Leitner: nhớ được thì thẻ lên hộp cao hơn và lâu mới gặp lại (1, 3, 7, 14, 30 ngày); quên thì về
          hộp 1. Tự nhớ lại trước khi lật thẻ là phần quan trọng nhất.
        </p>
      </div>
      <div className="cols">
        <div className="stack">
          <div className="card">
            <ReviewSession active={active} />
          </div>
          <AddCards />
        </div>
        <div className="card">
          <h3>Phân bố thẻ theo hộp</h3>
          <BoxChart />
        </div>
      </div>
      <CardList />
    </>
  );
}
