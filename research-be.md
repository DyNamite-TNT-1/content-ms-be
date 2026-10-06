## Mono repo là gì?

Mono repo nghĩa là một kho mã nguồn duy nhất chứa toàn bộ dự án.
Thay vì tách thành nhiều kho riêng (frontend một kho, backend một kho, thư viện chung một kho…), tất cả nằm chung một chỗ.

Ưu điểm: dễ chia sẻ code, dễ đồng bộ phiên bản, dễ quản lý thay đổi liên quan đến nhau.

Nhược điểm: kho sẽ rất lớn, cần công cụ hỗ trợ tốt để không bị rối.

## Khi nào nên dùng PostgreSQL, MongoDB, Redis, Kafka, Elastic Search

### Những thứ cần nghĩ trước khi chọn database

- Dự án của mình thực sự cần gì?
- Chi phí triển khai và vận hành.
- Team mình quen dùng loại nào hơn.
- Cộng đồng hỗ trợ lớn không.
- Nó có dễ kết nối với công nghệ đang dùng không.

---

### So sánh PostgreSQL và MongoDB

#### 1. Khả năng đọc dữ liệu

**PostgreSQL**  
Khi bạn sửa một dòng dữ liệu, nó không ghi đè thẳng lên dòng cũ. Nó tạo ra một bản mới, đánh dấu bản cũ là “hết hạn”, rồi thỉnh thoảng dọn dẹp.  
Nhờ vậy, nhiều người vẫn đọc được dữ liệu cũ trong lúc người khác đang sửa → đọc rất mượt, ít bị gián đoạn.

**MongoDB**  
Cũng đọc rất tốt, đặc biệt với dữ liệu không có cấu trúc cố định.

#### 2. Khả năng ghi dữ liệu

**PostgreSQL**  
Vì phải tạo bản mới mỗi lần sửa nên việc ghi hơi tốn công hơn một chút so với một số database khác.

**MongoDB**  
Nếu dữ liệu mới nhỏ hơn hoặc bằng dữ liệu cũ → nó sửa thẳng tại chỗ.  
Nếu lớn hơn → nó tìm chỗ khác để ghi, rồi đánh dấu chỗ cũ là hết hạn.  
Cách này giúp ghi nhanh hơn, đặc biệt khi có rất nhiều yêu cầu ghi liên tục (khoảng 2000–3000 request mỗi giây).

#### 3. Cách lưu trữ dữ liệu bên trong

**MongoDB** có 2 kiểu chính:
- **WiredTiger** (mặc định): lưu trên ổ cứng, có nén dữ liệu, cho phép nhiều người cùng sửa các tài liệu khác nhau cùng lúc. Có “sổ nhật ký” ghi lại thay đổi để khi máy sập vẫn khôi phục được.
- **In-Memory**: lưu hết trong RAM (rất nhanh) nhưng chỉ có bản trả phí, và tắt máy là mất dữ liệu.

**PostgreSQL** chỉ có một kiểu lưu trữ chính, nhưng rất chắc chắn:
- Luôn ghi “sổ cái” (WAL) trước khi thật sự lưu dữ liệu → rất an toàn.
- Có nhiều tiện ích mở rộng (extension) để làm thêm chức năng: lưu dữ liệu lớn, tìm kiếm nhanh, xử lý bản đồ, chia nhỏ dữ liệu ra nhiều máy…

#### 4. Đánh chỉ mục (để tìm kiếm nhanh)

Cả hai đều hỗ trợ rất nhiều loại chỉ mục khác nhau. Không bên nào thua kém rõ rệt ở điểm này.

#### 5. Nối dữ liệu từ nhiều bảng/collection (Join)

**PostgreSQL**  
Rất giỏi việc “nối” dữ liệu từ nhiều bảng lại với nhau. Nó tự chọn cách nối tối ưu nhất.

**MongoDB**  
Cũng có chức năng nối, nhưng hạn chế hơn.  
Thường người ta khuyên: thay vì nối, hãy nhét sẵn dữ liệu liên quan vào cùng một chỗ (embedded), hoặc tự nối ở phía code ứng dụng.

#### 6. Khả năng mở rộng khi dữ liệu lớn

- Mở rộng theo chiều dọc (mua máy mạnh hơn): cả hai đều làm tốt.
- Mở rộng theo chiều ngang (thêm nhiều máy):  
  **MongoDB** làm sẵn và dễ hơn.  
  **PostgreSQL** cũng làm được nhưng phải dùng thêm công cụ phụ, phức tạp hơn một chút.

#### 7. Hỗ trợ dữ liệu kiểu JSON

Cả hai đều làm được.
Nhưng MongoDB sinh ra để làm việc với JSON nên tự nhiên hơn.

#### 8. Tìm kiếm văn bản (full-text search)

Cả hai đều có khả năng tìm kiếm chữ khá tốt.
Nếu cần tìm kiếm cực mạnh và phức tạp thì thường người ta vẫn dùng thêm Elastic Search.

#### 9. Tính an toàn dữ liệu (ACID)

**PostgreSQL**  
Được thiết kế từ đầu để đảm bảo dữ liệu luôn đúng, không bị mất, không bị rối khi nhiều người cùng thao tác. Rất mạnh về giao dịch phức tạp.

**MongoDB**  
Từ phiên bản 4.0 trở đi cũng hỗ trợ giao dịch an toàn, nhưng vẫn có một số giới hạn (thời gian, kích thước) để không ảnh hưởng tốc độ.

#### 10. Cộng đồng

Cả hai đều rất lớn và năng động.  
PostgreSQL tồn tại lâu hơn, ổn định hơn.  
MongoDB phát triển nhanh trong nhóm database kiểu mới.

---

### Kết luận: Khi nào nên chọn cái nào?

**Nên chọn MongoDB khi:**
- Ít cần giao dịch phức tạp (transaction).
- Cấu trúc dữ liệu hay thay đổi.
- Cần ghi cực nhanh (nhiều request liên tục).
- Dữ liệu lớn, cần phân tích theo thời gian thực (ví dụ IoT).
- Team nhỏ, muốn làm nhanh.
- Cần mở rộng dễ dàng (thêm máy).
- Cần truy vấn theo vị trí địa lý.
- Dữ liệu lồng nhau phức tạp hoặc không có cấu trúc rõ ràng.

**Nên chọn PostgreSQL khi:**
- Ưu tiên dữ liệu phải đúng và an toàn hơn là tốc độ ghi cực cao.
- Cần đọc và truy vấn phức tạp tốt.
- Dữ liệu có cấu trúc rõ ràng, ít thay đổi.
- Thường xuyên phải nối nhiều bảng với nhau.
- Làm trong lĩnh vực cần tuân thủ nghiêm ngặt (tài chính, y tế…).

---

**Tóm lại**

- MongoDB giống như một cái hộp linh hoạt, nhét gì cũng được, mở rộng dễ, ghi nhanh → hợp với dữ liệu thay đổi nhiều, cần tốc độ và scale.
- PostgreSQL giống như một cái tủ ngăn nắp, quy củ, rất chắc chắn → hợp với dữ liệu có quan hệ rõ ràng, cần độ tin cậy cao và truy vấn phức tạp.

Không có cái nào “tốt hơn” tuyệt đối. Chọn cái nào phù hợp với nhu cầu thực tế của dự án mới là đúng.

---

### 1. Redis – “Bộ nhớ siêu tốc tạm thời”

**Bản chất thật sự**  
Redis không phải là database chính để lưu dữ liệu lâu dài. Nó giống như một tờ giấy ghi chú dán ngay trên bàn làm việc: lấy ra cực nhanh, ghi vào cũng cực nhanh, nhưng không dùng để cất đồ quan trọng lâu dài.

Nó lưu hầu hết dữ liệu trong RAM (bộ nhớ máy tính), nên tốc độ cực cao (có thể đạt hàng chục nghìn đến hàng trăm nghìn thao tác mỗi giây). Khi tắt máy hoặc mất điện, dữ liệu có thể mất (trừ khi bạn cấu hình lưu ra ổ cứng định kỳ).

**So với PostgreSQL / MongoDB**  
- PostgreSQL / MongoDB: lưu trên ổ cứng → chậm hơn nhưng an toàn, bền vững.  
- Redis: lưu trong RAM → siêu nhanh nhưng dễ mất dữ liệu nếu không cẩn thận.

**Điểm mạnh**  
- Tốc độ đọc/ghi cực cao.  
- Hỗ trợ nhiều kiểu dữ liệu tiện lợi (chuỗi, danh sách, tập hợp, bảng xếp hạng…).  
- Rất giỏi làm cache, đếm số, xếp hạng tạm thời, lưu phiên đăng nhập.

**Điểm yếu**  
- Không phải nơi lưu dữ liệu quan trọng lâu dài.  
- Dữ liệu lớn quá sẽ tốn rất nhiều RAM (đắt tiền).  
- Không giỏi truy vấn phức tạp như PostgreSQL.

**Khi nào nên dùng Redis**  
- Cần trả kết quả cực nhanh (cache kết quả truy vấn database).  
- Lưu session đăng nhập, giỏ hàng tạm thời.  
- Đếm lượt view, like, xếp hạng theo thời gian thực.  
- Làm hàng đợi đơn giản hoặc pub/sub nhẹ.

**Khi nào không nên dùng**  
- Làm database chính cho dữ liệu quan trọng (đơn hàng, thông tin người dùng…).  
- Cần truy vấn phức tạp, join nhiều bảng.

Các công dụng chính của Redis:
• Làm bộ nhớ đệm (Caching): Lưu lại kết quả của các truy vấn hoặc tính toán nặng vào RAM. Lần truy cập sau, ứng dụng sẽ lấy từ Redis thay vì phải hỏi lại cơ sở dữ liệu chính (như MySQL, PostgreSQL), giúp website phản hồi tức thì và giảm tải cho server.
• Lưu trữ Session người dùng: Lưu thông tin đăng nhập, giỏ hàng hoặc trạng thái của người dùng trên web. Dữ liệu này truy xuất rất nhanh và có thể tự động xóa sau một khoảng thời gian nhờ tính năng TTL (Time to Live).
• Xử lý hàng đợi (Message Queue / Pub-Sub): Hỗ trợ tính năng gửi và nhận thông báo thời gian thực giữa các thành phần khác nhau của hệ thống (ví dụ: hệ thống gửi email tự động, xử lý video nền).
• Đếm và thống kê thời gian thực (Counters & Real-time Analytics): Dùng để đếm số lượt xem bài viết, lượt thích, hoặc xếp hạng người chơi game (Leaderboard) với tốc độ cao nhờ cấu trúc dữ liệu Sorted Set

---

### 2. Kafka – “Băng chuyền siêu lớn chuyên chở tin nhắn”

**Bản chất thật sự**  
Kafka không phải database để lưu trữ và truy vấn dữ liệu. Nó là hệ thống chuyên chở tin nhắn (message broker) cực mạnh.

Hãy tưởng tượng một băng chuyền khổng lồ trong nhà máy:  
- Nhiều máy (ứng dụng) có thể đổ tin nhắn lên băng chuyền.  
- Nhiều máy khác có thể lấy tin nhắn xuống để xử lý, mỗi máy lấy theo tốc độ của mình.  
- Tin nhắn được giữ lại trên băng chuyền một thời gian (có thể vài ngày đến vài tuần), nên nếu máy nhận bị chậm hoặc sập, sau này vẫn lấy lại được.

**So với PostgreSQL / MongoDB / Redis**  
- Database: lưu dữ liệu để sau này truy vấn.  
- Kafka: chuyên chở và phân phối dữ liệu giữa các hệ thống theo thời gian thực.

**Điểm mạnh**  
- Chịu được lượng tin nhắn cực lớn (hàng triệu tin nhắn mỗi giây).  
- Đảm bảo thứ tự tin nhắn trong từng “làn” (partition).  
- Có thể giữ tin nhắn lâu, cho phép nhiều hệ thống đọc lại.  
- Rất ổn định khi hệ thống lớn, nhiều service nói chuyện với nhau.

**Điểm yếu**  
- Không dùng để truy vấn dữ liệu kiểu “tìm user theo id”.  
- Cấu hình và vận hành phức tạp hơn Redis.  
- Không phải nơi lưu dữ liệu lâu dài vĩnh viễn.

**Khi nào nên dùng Kafka**  
- Hệ thống lớn, nhiều service cần gửi/nhận sự kiện (user đăng ký, đặt hàng, thanh toán…).  
- Cần xử lý dữ liệu theo thời gian thực với lưu lượng rất cao.  
- Muốn tách rời các phần của hệ thống (một bên gửi, nhiều bên nhận độc lập).  
- Cần lưu lại lịch sử sự kiện để xử lý lại sau.

**Khi nào không nên dùng**  
- Ứng dụng nhỏ, ít sự kiện.  
- Chỉ cần cache hoặc lưu tạm (dùng Redis là đủ).  
- Cần truy vấn dữ liệu phức tạp.

Các công dụng chính của Kafka:
Các ứng dụng thực tế phổ biến
• Thu thập log: Gom dữ liệu log từ nhiều server, ứng dụng khác nhau về một nơi tập trung để giám sát.
• Theo dõi hành vi người dùng: Ghi lại thao tác click chuột, lịch sử xem phim hay tìm kiếm trên website để đưa ra gợi ý sản phẩm phù hợp theo thời gian thực (như Netflix, Tiki, Uber dùng).
• Xử lý giao dịch tài chính: Nhận và chuyển tiếp các lệnh thanh toán, biến động số dư từ ngân hàng sang các hệ thống phụ trợ một cách tuần tự, ổn định.
• Làm đường ống dữ liệu (Data Pipeline): Kết nối dữ liệu trung gian giữa các cơ sở dữ liệu và hệ thống kho dữ liệu lớn (data warehouse).

---

### 3. Elastic Search – “Máy tìm kiếm chuyên dụng siêu mạnh”

**Bản chất thật sự**  
Elastic Search không phải database chính để lưu dữ liệu nghiệp vụ. Nó là công cụ chuyên đi tìm kiếm và phân tích cú pháp cực nhanh và linh hoạt.

Nó lấy dữ liệu từ database chính (PostgreSQL/MongoDB…), rồi “lập chỉ mục” sẵn theo cách tối ưu cho việc tìm kiếm. Nhờ vậy, tìm theo từ khóa, tìm gần đúng, tìm theo nhiều điều kiện phức tạp đều rất nhanh.

**So với PostgreSQL / MongoDB**  
- PostgreSQL / MongoDB cũng có tìm kiếm, nhưng khi dữ liệu lớn và yêu cầu tìm kiếm phức tạp thì sẽ chậm và khó tối ưu.  
- Elastic Search sinh ra để làm việc này → nhanh và mạnh hơn rất nhiều.

**Điểm mạnh**  
- Tìm kiếm full-text cực mạnh (tìm “điện thoại” vẫn ra “smartphone”, “mobile phone”…).  
- Hỗ trợ tìm kiếm mờ, tìm theo khoảng, theo vị trí địa lý, theo nhiều điều kiện kết hợp.  
- Scale rất tốt khi dữ liệu tìm kiếm lớn.  
- Có giao diện đẹp (Kibana) để xem log, biểu đồ.

**Điểm yếu**  
- Không phải nơi lưu dữ liệu chính (không nên dùng làm database nghiệp vụ).  
- Dữ liệu có thể hơi chậm hơn so với database chính (vì phải đồng bộ).  
- Tốn tài nguyên (RAM, CPU) khá nhiều.  
- Không mạnh về giao dịch phức tạp (ACID).

**Khi nào nên dùng Elastic Search**  
- Tính năng tìm kiếm sản phẩm, bài viết, người dùng… cần nhanh và thông minh.  
- Lưu và tìm kiếm log lỗi, hành vi người dùng.  
- Cần phân tích dữ liệu theo thời gian thực (dashboard).  
- Khi PostgreSQL/MongoDB tìm kiếm đã bị chậm.

**Khi nào không nên dùng**  
- Làm database chính.  
- Ứng dụng nhỏ, tìm kiếm đơn giản (dùng sẵn của PostgreSQL/MongoDB là đủ).

---

**Cách dùng thực tế phổ biến nhất hiện nay:**

- PostgreSQL hoặc MongoDB → lưu dữ liệu chính.  
- Redis → làm cache và tăng tốc.  
- Kafka → chuyển sự kiện giữa các service.  
- Elastic Search → chuyên trách tìm kiếm và phân tích.

Mỗi công cụ giải quyết một “nỗi đau” khác nhau. Không có cái nào thay thế hoàn toàn cái nào.
