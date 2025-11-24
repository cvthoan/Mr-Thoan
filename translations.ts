
export interface PromptItem {
  title: string;
  description: string;
  prompt: string;
}

export interface PromptSection {
  season: string;
  items: PromptItem[];
}

export const translations = {
  vi: {
    // Header
    loadApiKey: 'LẠP API KEY',
    setupShopInfo: 'Thiết lập thông tin Shop',
    setupShopInfoShort: 'Thông tin Shop',
    updateShopInfo: 'Cập nhật thông tin Shop',
    joinZaloGroup: 'Tham gia nhóm Zalo',
    contactAuthor: 'Liên hệ tác giả',
    logout: 'Đăng xuất & Xóa dữ liệu phiên',
    minimizeApp: 'Thu nhỏ ứng dụng',
    exitApp: 'Thoát ứng dụng',
    zoomIn: 'Phóng to',
    zoomOut: 'Thu nhỏ',
    resetZoom: 'Reset Zoom',

    // App Tabs
    styleTab: 'TẠO DÁNG & QC',
    extractTab: 'TÁCH SẢN PHẨM',
    foldTab: 'GẤP ĐỒ',
    videoTab: 'VIDEO',
    creativeTab: 'PHÔNG NỀN & Xóa Watermark',

    // Tab Info
    styleTabTitle: 'TẠO DÁNG SẢN PHẨM & VIẾT QUẢNG CÁO',
    styleTabDescription: 'Trung tâm sáng tạo toàn diện: từ ảnh ma-nơ-canh chuyên nghiệp, cho AI mặc thử, đến tạo ảnh nghệ thuật và viết nội dung quảng cáo chỉ trong một nốt nhạc.',
    extractTabTitle: 'TÁCH SẢN PHẨM KHỎI NGƯỜI MẪU',
    extractTabDescription: 'Tải lên ảnh người mẫu đang mặc sản phẩm (ảnh feedback, ảnh chụp vội,...), AI sẽ tự động tách riêng sản phẩm ra nền trắng và tạo thêm mặt sau.',
    foldTabTitle: 'GẤP QUẦN ÁO',
    foldTabDescription: 'Tự động tạo ảnh sản phẩm được gấp gọn gàng, chuyên nghiệp. Hoàn hảo để đăng kèm trong bộ ảnh sản phẩm.',
    videoTabTitle: 'TẠO VIDEO SẢN PHẨM',
    videoTabDescription: 'Biến ảnh tĩnh thành các video ngắn đầy thu hút: video 360°, video sáng tạo theo kịch bản, hoặc video người mẫu trình diễn.',
    creativeTabTitle: 'SÁNG TẠO PHÔNG NỀN & LÀM SẠCH ẢNH',
    creativeTabDescription: 'Thay thế phông nền cho sản phẩm của bạn. Tải lên ảnh sản phẩm đã tách nền và để AI tạo ra bối cảnh hoàn hảo.',

    // App.tsx UI
    generating: 'AI đang sáng tạo, vui lòng đợi...',
    generateImages: 'Tạo Ảnh',

    // Style Tab >> Sub-modes
    ghostMannequinMode: 'Ma-nơ-canh Vô hình',
    modelMode: 'Người Mẫu',
    creativeMode: 'Ảnh Sáng tạo',
    adCopyMode: 'Viết QC',

    // Style Tab -> Ghost Mode
    ghostUploadTitle: '1. Tải lên ảnh sản phẩm',
    ghostUploadTip: 'Mẹo: Tải lên cả ảnh mặt trước và mặt sau để AI tạo bộ 4 góc nhìn chính xác nhất.',
    ghostOptionsTitle: '2. Chọn tùy chọn',
    ghostFormFactor: 'Phom dáng:',
    ghostAdult: 'Người lớn',
    ghostChild: 'Trẻ em',
    ghostAdvancedPrompt: 'Sử dụng Prompt Nâng Cao (Chất lượng 8K)',
    ghostUseMaterial: 'Tải ảnh chất liệu vải (dùng khi vải có hoa văn phức tạp)',
    ghostCustomizations: 'Tùy chỉnh thêm (nâng cao):',
    ghostCustomizationsPlaceholder: 'Ví dụ: làm cho áo phồng hơn, thêm hiệu ứng gió thổi',

    // Style Tab -> Model Mode
    modelSourceTitle: '1. Nguồn ảnh sản phẩm',
    modelSourceTip: 'Mẹo: Để có kết quả tốt nhất, hãy tạo ảnh "Ma-nơ-canh Vô hình" trước rồi dùng ảnh đó ở đây.',
    modelOptionsTitle: '2. Chọn người mẫu & tùy chỉnh',
    modelType: 'Loại người mẫu:',
    modelGender: 'Giới tính:',
    modelMale: 'Nam',
    modelFemale: 'Nữ',
    modelUseFace: 'Ghép mặt người mẫu (tùy chọn)',
    modelNewFace: 'Tạo khuôn mặt khác (Đẹp hơn, Tây hơn)',
    modelHoldProduct: 'Cho người mẫu cầm thêm sản phẩm (tùy chọn)',
    modelAutoFromProduct: 'Tự Tạo người mẫu theo sản phẩm', // New translation
    modelAutoFromProductTip: 'AI sẽ phân tích phụ kiện để tự chọn trang phục & bối cảnh phù hợp', // New translation
    modelUseBackdrop: 'Chọn bối cảnh (nên dùng)',
    modelShowBackdropList: 'Hiện danh sách bối cảnh',
    modelHideBackdropList: 'Ẩn danh sách bối cảnh',
    modelSeasonalEvents: 'Theo Mùa & Sự Kiện',
    modelStudioAds: 'Studio & Quảng Cáo',
    modelCustomizations: 'Tùy chỉnh thêm (nếu không chọn bối cảnh):',
    modelRewritePrompt: 'Viết Lại hay hơn',
    modelRewriting: 'Đang viết...',
    modelCustomizationsPlaceholder: 'người mẫu trước phông nền kim loại màu bạc hoặc vàng đồng...',

    // Style Tab -> Creative Mode
    creativeUploadTitle: '1. Tải ảnh sản phẩm (tùy chọn)',
    creativeUploadTip: 'Nếu bạn chọn hoặc tải ảnh lên, AI sẽ biến đổi sản phẩm trong ảnh. Nếu không, AI sẽ tự tạo ảnh mới từ đầu.',
    creativeOptionsTitle: '2. Chọn ý tưởng sáng tạo',
    creativeProductName: 'Tên sản phẩm (để điền vào prompt):',
    creativeProductNamePlaceholder: 'Ví dụ: Áo Sơ Mi Lụa',
    creativeShowIdeas: 'Hiện danh sách ý tưởng',
    creativeHideIdeas: 'Ẩn danh sách ý tưởng',
    creativeGetIdea: 'Lấy ý tưởng',
    creativePrompt: 'Ý tưởng sáng tạo (có thể chỉnh sửa):',
    creativePromptPlaceholder: 'Chọn một ý tưởng ở trên hoặc tự viết yêu cầu của bạn...',

    // Style Tab -> Ad Copy Mode
    adCopyUploadTitle: '1. Chọn hoặc tải ảnh sản phẩm để AI phân tích',
    adCopyInfoTitle: '2. Nhập thông tin cần thiết',
    adCopyInfoPlaceholder: 'Ví dụ: 199K, phong cách hài hước',
    adCopyShopInfoTip: 'Mẹo: Thông tin shop chưa được thiết lập. Hãy thiết lập ở thanh công cụ để AI tự động chèn vào bài viết.',
    seasonSummer: 'Hàng Hè',
    seasonAutumn: 'Hàng Thu',
    seasonWinter: 'Hàng Đông',
    
    // Results Area
    results: 'Kết quả',
    resultsHere: 'Kết quả sẽ xuất hiện ở đây.',
    downloadAll: 'Tải về tất cả',
    view: 'Xem',
    download: 'Tải về',
    createVideo: 'Tạo Video',
    createWalkVideo: 'Tạo Video Dáng Đi',
    cleaning: 'Đang làm sạch...',
    restoreTooltip: 'Hoàn tác về ảnh gốc trước khi làm sạch',
    restore: 'Hoàn tác',
    autoCleanTooltip: 'Để AI tự động tìm và xóa các chi tiết thừa',
    autoClean: 'Tự động',
    manualCleanTooltip: 'Tự dùng bút tô vào vùng cần xóa',
    manualClean: 'Dùng bút',
    deleteThisImage: 'Xóa ảnh này',
    frontView: 'Mặt trước',
    backView: 'Mặt sau',
    topDownView: 'Gấp (nhìn từ trên)',
    perspectiveView: 'Gấp (phối cảnh)',
    
    // Extract Tab
    extractUploadTitle: '1. Tải lên ảnh người mẫu mặc sản phẩm',
    extractOptionsTitle: '2. Chọn loại sản phẩm cần tách',
    extractWholeSet: 'Tách cả bộ',
    extractShirtOnly: 'Chỉ tách áo',
    extractPantsOnly: 'Chỉ tách quần',
    extracting: 'Đang tách sản phẩm...',
    extractButton: 'Tách Sản Phẩm',

    // Fold Tab
    foldUploadTitle: '1. Tải lên ảnh sản phẩm (chưa gấp)',
    foldUploadTip: 'Mẹo: Để có kết quả tốt nhất, hãy dùng ảnh đã được tạo từ "Ma-nơ-canh Vô hình" hoặc "Tách Sản Phẩm".',
    folding: 'Đang gấp...',
    foldButton: 'Gấp Sản Phẩm',
    
    // Video Tab
    video360: 'Video 360°',
    videoCreative: 'Video Sáng Tạo',
    videoWalk: 'Dáng đi Người mẫu',
    videoSourceTitle: '1. Nguồn ảnh sản phẩm',
    videoWalkSourceTip: 'Mẹo: Chức năng này hoạt động tốt nhất với ảnh được tạo từ chế độ "Người Mẫu".',
    videoGenericSourceTip: 'Mẹo: Sử dụng ảnh đã tách nền (từ "Ma-nơ-canh Vô hình" hoặc "Tách Sản Phẩm") để có kết quả đẹp nhất.',
    video360Options: 'Tùy chỉnh (nâng cao)',
    video360Placeholder: 'Mặc định: Video xoay 360° trên nền trắng',
    videoCreativeOptions: '2. Chọn ý tưởng video',
    videoCreativeProductName: 'Tên sản phẩm (để điền vào prompt):',
    videoCreativeProductNamePlaceholder: 'Ví dụ: Váy Dạ Hội Lấp Lánh',
    videoShowIdeas: 'Hiện danh sách ý tưởng',
    videoHideIdeas: 'Ẩn danh sách ý tưởng',
    videoGetIdea: 'Lấy ý tưởng',
    videoPromptHelper: 'Trợ lý Prompt',
    videoCreativePrompt: 'Kịch bản video (có thể chỉnh sửa):',
    videoCreativePromptPlaceholder: 'Chọn một ý tưởng ở trên hoặc tự viết kịch bản của bạn...',
    videoWalkOptions: '2. Chọn loại người mẫu và dáng đi',
    videoWalkTypeChild: 'Trẻ em',
    videoWalkTypeAdult: 'Người lớn',
    videoWalkShowList: 'Hiện danh sách dáng đi',
    videoWalkHideList: 'Ẩn danh sách dáng đi',
    videoWalkPrompt: 'Kịch bản dáng đi (có thể chỉnh sửa):',
    videoWalkPromptPlaceholder: 'Chọn một dáng đi ở trên hoặc tự tùy chỉnh...',
    videoFormat: '3. Chọn định dạng video',
    videoVertical: 'Video Dọc (9:16)',
    videoHorizontal: 'Video Ngang (16:9)',
    videoCreating: 'Đang tạo video',
    videoCreateButton: 'Tạo Video',
    videoLifetimeQuotaTitle: 'Lỗi Hạn Ngạch Trọn Đời',
    videoLifetimeQuotaDesc: 'API Key này đã hết hạn ngạch trọn đời để tạo video. Đây là giới hạn của Google và không thể reset.',
    videoLifetimeQuotaOptions: 'Bạn có các lựa chọn sau:',
    videoLifetimeQuotaOption1: 'Sử dụng key thay thế:',
    videoLifetimeQuotaOption1Link: 'Nhận Key tại đây',
    videoLifetimeQuotaOption2: 'Chuyển sang dùng các tính năng tạo ảnh khác.',
    videoDone: 'Tạo video thành công!',
    videoDownload: 'Tải Video',
    
    // Creative (Background) Tab
    creativeBgUploadTitle: '1. Tải lên ảnh sản phẩm (đã tách nền)',
    creativeBgUploadTip: 'Mẹo: Để có kết quả tốt nhất, hãy dùng ảnh đã được tạo từ "Ma-nơ-canh Vô hình" hoặc "Tách Sản Phẩm".',
    creativeBgOptionsTitle: '2. Chọn loại hiệu ứng',
    creativeBgCreating: 'Đang tạo phông nền...',
    creativeBgCreateButton: 'Tạo Phông Nền',
    removeWatermark: 'Xóa Watermark - Chữ và dấu trên ảnh',
    removingWatermark: 'Đang xóa watermark...',
    
    // Ad Copy Results
    adCopyResultTitle: 'Kết quả bài viết',
    adCopyLoading: 'AI đang phân tích và viết bài...',
    adCopyResultSources: 'Nguồn tham khảo:',
    adCopyResultPlaceholder: 'Nội dung quảng cáo sẽ xuất hiện ở đây.',
    audioGenerating: 'Đang tạo giọng đọc...',
    audioGenerate: 'Tạo giọng đọc MP3',
    imageFromTextGenerating: 'Đang tạo ảnh...',
    imageFromTextGenerate: 'Tạo ảnh cho nội dung này',
    audioDownload: 'Tải âm thanh',
    adCopyCopy: 'Sao chép',
    adCopyCopied: 'Đã sao chép!',
    adCopySpeak: 'Đọc bài viết',
    adCopyStop: 'Dừng đọc',
    imageFromTextResultTitle: 'Ảnh được tạo từ nội dung',
    imageFromTextResultAlt: 'Ảnh quảng cáo được tạo bởi AI',
    close: 'Đóng',
    // Custom Audio Player
    playerPlay: 'Phát',
    playerPause: 'Tạm dừng',
    playerStop: 'Dừng',
    playerDownload: 'Tải về file âm thanh',

    // Quota Error
    quotaErrorTitle: 'Lỗi Hạn Ngạch API',
    quotaErrorDesc: 'Hạn ngạch API cho Project này đã được sử dụng hết. Vui lòng sử dụng một API Key từ một Google Cloud Project khác.',
    quotaStep1: 'Bước 1: Tạo một Google Cloud Project HOÀN TOÀN MỚI.',
    quotaStep2: 'Bước 2: Trong Project mới đó, hãy BẬT (ENABLE) "Generative Language API".',
    quotaStep2Link: 'Bật tại đây',
    quotaStep3: 'Bước 3: Tạo một API Key mới trong Project đó và dán vào ứng dụng.',
    
    // Aspect Ratio
    aspectRatio: '3. Tỷ lệ khung hình',
    
    // Placeholder for complex data to avoid runtime errors
    creativeConceptPrompts: [
        'Một poster phim hành động của sản phẩm, với hiệu ứng cháy nổ và ánh sáng kịch tính.',
        'Sản phẩm được nhân cách hóa thành một nhân vật hoạt hình dễ thương đang phiêu lưu trong một thế giới thần tiên.',
        'Ảnh chụp macro sản phẩm, nhấn mạnh vào chất liệu vải, với các giọt nước đọng trên bề mặt.',
        'Sản phẩm được trưng bày trong một viện bảo tàng nghệ thuật, như một tác phẩm điêu khắc quý giá.'
    ],
    
    // Creative Prompts Data - New Categorized List
    creativePromptsData: [
      { season: 'Nghệ Thuật & Phim Ảnh', items: [
          { title: 'Poster Phim Hành Động', description: 'Hiệu ứng cháy nổ, khói lửa, kịch tính, bom tấn Hollywood.', prompt: 'Một poster phim hành động bom tấn với sản phẩm là nhân vật chính, hiệu ứng cháy nổ hoành tráng, tia lửa điện, khói bụi và ánh sáng kịch tính tương phản cao.' },
          { title: 'Phong Cách Anime', description: 'Nét vẽ hoạt hình Nhật Bản, bầu trời xanh, mây trắng, rực rỡ.', prompt: 'Sản phẩm được vẽ theo phong cách Anime Nhật Bản chất lượng cao, bầu trời xanh thẳm, mây trắng cuồn cuộn, ánh sáng rực rỡ và các chi tiết lấp lánh.' },
          { title: 'Tranh Sơn Dầu Cổ Điển', description: 'Nét cọ sơn dầu, khung cảnh thời Phục Hưng, sang trọng, nghệ thuật.', prompt: 'Sản phẩm xuất hiện như một kiệt tác trong bức tranh sơn dầu thời Phục Hưng, với các nét cọ dày, ánh sáng chiaroscuro huyền bí và khung cảnh cổ điển sang trọng.' },
          { title: 'Cyberpunk Neon', description: 'Thành phố tương lai, đèn neon xanh tím, mưa, phản chiếu.', prompt: 'Sản phẩm đặt trong thành phố Cyberpunk tương lai, rực rỡ với đèn neon xanh và tím, đường phố ướt mưa phản chiếu ánh sáng, không khí công nghệ cao.' }
      ]},
      { season: 'Thiên Nhiên & Giả Tưởng', items: [
          { title: 'Đảo Bay Thần Tiên', description: 'Sản phẩm trên hòn đảo bay lơ lửng, thác nước, mây trôi.', prompt: 'Sản phẩm nằm trên một hòn đảo bay lơ lửng giữa bầu trời, có thác nước nhỏ chảy xuống, dây leo xanh mướt và những đám mây trôi bồng bềnh xung quanh.' },
          { title: 'Thế Giới Tí Hon', description: 'Sản phẩm khổng lồ trong khu rừng nấm hoặc thành phố tí hon.', prompt: 'Sản phẩm khổng lồ đặt giữa một khu rừng nấm tí hon phát sáng, với những ngôi nhà nhỏ xíu và cư dân tí hon đang ngước nhìn.' },
          { title: 'Băng Giá Vĩnh Cửu', description: 'Hang động băng, tinh thể tuyết, ánh sáng xanh lạnh lẽo.', prompt: 'Sản phẩm đóng băng nghệ thuật trong một hang động băng giá vĩnh cửu, xung quanh là các tinh thể tuyết lấp lánh và ánh sáng xanh dương lạnh lẽo, huyền bí.' },
          { title: 'Sa Mạc Huyền Bí', description: 'Cát vàng trải dài, bầu trời đầy sao, kim tự tháp, ảo ảnh.', prompt: 'Sản phẩm nằm giữa sa mạc cát vàng mênh mông dưới bầu trời đêm đầy sao dải ngân hà, phía xa là bóng dáng kim tự tháp và ảo ảnh lung linh.' }
      ]},
      { season: 'Hiệu Ứng & Chất Liệu', items: [
          { title: 'Bùng Nổ Nước', description: 'Tia nước bắn tung tóe, sảng khoái, tinh khiết, slow-motion.', prompt: 'Sản phẩm tương tác với dòng nước bùng nổ mạnh mẽ, các giọt nước bắn tung tóe xung quanh tạo thành vương miện nước, chụp ở tốc độ cao sắc nét.' },
          { title: 'Khói Màu Nghệ Thuật', description: 'Những dải khói màu uốn lượn, ma mị, mềm mại bao quanh.', prompt: 'Sản phẩm được bao quanh bởi những dải khói màu (hồng, xanh, tím) uốn lượn nghệ thuật, tạo cảm giác ma mị, mềm mại và bí ẩn.' },
          { title: 'Vàng Chảy Sang Trọng', description: 'Dòng vàng lỏng chảy quanh sản phẩm, kim loại, cao cấp.', prompt: 'Sản phẩm được bao phủ một phần bởi dòng vàng lỏng đang chảy xuống, tạo cảm giác kim loại nóng chảy, sang trọng, quyền lực và đắt tiền.' }
      ]}
    ],

    videoCreativeConceptPrompts: [
        'Video cinematic quay chậm, máy quay bay vòng quanh sản phẩm đang trôi nổi giữa một vườn hoa anh đào.',
        'Video stop-motion vui nhộn, sản phẩm tự di chuyển và nhảy múa theo điệu nhạc.',
        'Video quảng cáo theo phong cách retro thập niên 80, với màu sắc neon và hiệu ứng hình ảnh cổ điển.'
    ],
    
    // Walking Prompts - Restored
    childWalkPromptsData: [
        { season: 'Dáng Đi Cơ Bản', items: [
            { title: 'Đi bộ vui vẻ', description: 'Bé đi bộ tự nhiên, mỉm cười tươi tắn.', prompt: 'A happy child model walking naturally forward, smiling brightly.' },
            { title: 'Chạy nhảy năng động', description: 'Bé chạy nhẹ nhàng, thể hiện sự năng động.', prompt: 'A child model running playfully forward, full of energy.' }
        ]}
    ],
    adultWalkPromptsData: [
        { season: 'Sàn Diễn Thời Trang', items: [
            { title: 'Catwalk Tự tin', description: 'Dáng đi người mẫu chuyên nghiệp, thần thái tự tin.', prompt: 'A professional fashion model walking confidently on a runway.' },
            { title: 'Thanh Lịch', description: 'Dáng đi nhẹ nhàng, quý phái.', prompt: 'A model walking elegantly and gracefully.' }
        ]},
        { season: 'Đời Thường', items: [
            { title: 'Dạo Phố', description: 'Đi bộ tự nhiên trên đường phố.', prompt: 'A model walking casually on a city street.' },
            { title: 'Năng Động', description: 'Đi bộ nhanh, phong cách thể thao.', prompt: 'A model walking briskly with athletic energy.' }
        ]}
    ],

    // Seasonal Prompts - Restored & Expanded
    seasonalPromptsBaseData: [
      { season: 'Mùa Xuân & Tết Nguyên Đán', items: [
          { title: 'Tết Truyền Thống', description: 'Không gian nhà cổ, cành đào, bánh chưng, câu đối đỏ.', prompt: '' },
          { title: 'Vườn Xuân Rực Rỡ', description: 'Vườn hoa xuân khoe sắc, bướm lượn, nắng ấm.', prompt: '' },
          { title: 'Phố Ông Đồ', description: 'Phố cổ với giấy đỏ, mực tàu, nét đẹp văn hóa.', prompt: '' }
      ]},
      { season: 'Mùa Hè & Du Lịch', items: [
          { title: 'Bãi Biển Nhiệt Đới', description: 'Biển xanh, cát trắng, nắng vàng, hàng dừa.', prompt: '' },
          { title: 'Hồ Bơi Resort', description: 'Sang trọng, mát mẻ, cocktail, ghế dài.', prompt: '' },
          { title: 'Dã Ngoại Mùa Hè', description: 'Thảm cỏ xanh, giỏ đồ ăn, không khí trong lành.', prompt: '' }
      ]},
      { season: 'Mùa Thu & Lãng Mạn', items: [
          { title: 'Thu Hà Nội', description: 'Lá vàng rơi, phố cổ rêu phong, nắng hanh vàng.', prompt: '' },
          { title: 'Góc Cafe Chill', description: 'Quán cafe yên tĩnh, sách, nhạc nhẹ, tông màu nâu ấm.', prompt: '' },
          { title: 'Sân Trường', description: 'Hàng ghế đá, sân trường rợp bóng cây, hoài niệm.', prompt: '' }
      ]},
      { season: 'Mùa Đông & Lễ Hội', items: [
          { title: 'Giáng Sinh Ấm Áp', description: 'Cây thông Noel, lò sưởi, hộp quà, tuyết trắng.', prompt: '' },
          { title: 'Dạ Tiệc Cuối Năm', description: 'Ánh đèn lung linh, pháo hoa, ly rượu vang, sang trọng.', prompt: '' },
          { title: 'Mùa Đông Tuyết Phủ', description: 'Cảnh tuyết trắng xóa, rừng thông, áo len, khăn quàng.', prompt: '' }
      ]},
      { season: 'Sự Kiện Đặc Biệt', items: [
          { title: 'Valentine Lãng Mạn', description: 'Hoa hồng, nến, socola, tông màu đỏ hồng.', prompt: '' },
          { title: 'Quốc Tế Phụ Nữ', description: 'Tràn ngập hoa tươi, quà tặng, tôn vinh vẻ đẹp phái nữ.', prompt: '' },
          { title: 'Mùa Cưới', description: 'Cổng hoa, lễ đường, không gian tiệc cưới lộng lẫy.', prompt: '' }
      ]}
    ],

    // Advertising Backdrops - Restored & Expanded
    advertisingBackdropPrompts: [
      { season: 'Studio Chuyên Nghiệp', items: [
          { title: 'Tối Giản (Minimalist)', description: 'Nền trơn, màu sắc trung tính, tập trung hoàn toàn vào sản phẩm.', prompt: '' },
          { title: 'High-Key (Sáng Sủa)', description: 'Ánh sáng mạnh, nền trắng/sáng, hiện đại, sạch sẽ.', prompt: '' },
          { title: 'Low-Key (Huyền Bí)', description: 'Nền tối, ánh sáng tương phản cao, sang trọng, ấn tượng.', prompt: '' }
      ]},
      { season: 'Phong Cách & Chất Liệu', items: [
          { title: 'Luxury (Sang Trọng)', description: 'Đá cẩm thạch, chi tiết vàng kim, nội thất cao cấp.', prompt: '' },
          { title: 'Industrial (Công Nghiệp)', description: 'Tường bê tông, kim loại, phong cách bụi bặm, cá tính.', prompt: '' },
          { title: 'Vintage (Cổ Điển)', description: 'Gỗ mộc, tông màu ấm, đồ nội thất xưa cũ.', prompt: '' },
          { title: 'Pastel (Ngọt Ngào)', description: 'Màu kẹo ngọt, mềm mại, dễ thương, trẻ trung.', prompt: '' }
      ]},
      { season: 'Thiên Nhiên & Đời Sống', items: [
          { title: 'Thành Thị (Urban)', description: 'Đường phố hiện đại, tòa nhà kính, năng động.', prompt: '' },
          { title: 'Khu Vườn Nắng', description: 'Cây xanh, hoa lá, ánh nắng tự nhiên.', prompt: '' },
          { title: 'Bầu Trời (Sky)', description: 'Mây trắng, trời xanh, không gian mở, tự do.', prompt: '' }
      ]},
      { season: 'Nghệ Thuật & Trừu Tượng', items: [
          { title: 'Neon Cyberpunk', description: 'Ánh sáng neon, màu sắc rực rỡ, tương lai.', prompt: '' },
          { title: 'Hình Khối (Geometric)', description: 'Các khối hình học, bố cục lạ mắt, nghệ thuật.', prompt: '' }
      ]}
    ],
    
    modelSeasonalPrompt: (title: string, description: string) => `một người mẫu mặc sản phẩm trong bối cảnh ${title}, với không khí ${description}`,
    productSeasonalPrompt: (title: string, description: string) => `sản phẩm được đặt trong bối cảnh ${title}, với không khí ${description}`,
  },
};

export type Language = keyof typeof translations;

export const getTranslator = (language: Language) => {
    const langData = translations[language] || translations.vi;
    
    return (key: any, ...args: any[]): any => {
        const value = langData[key as keyof typeof langData];

        if (typeof value === 'function') {
            return (value as (...args: any[]) => any)(...args);
        }
        
        if (typeof value === 'string') {
            return value.replace(/{(\d)}/g, (match, index) => {
                return typeof args[index] !== 'undefined' ? args[index] : match;
            });
        }
        
        return value !== undefined ? value : `[${key}]`;
    };
};
