-- Insert Govee guides (English only for now)
INSERT INTO brand_setup_guides (brand_id, language_code, step_order, title, content, help_fields) VALUES
('govee', 'ko', 1,                                                                                     'Govee 앱 열기','iOS 또는 Android 휴대폰에서 Govee 앱을 실행하세요.','{}'),
('govee', 'ko', 2,                                                                                     'API 키 가져오기','프로필(Profile) > 설정(Settings) > API Key로 이동하세요. 전체 키(UUID 형식)를 복사하세요. 이 키는 기기를 인증하는 데 사용됩니다.','{"api_key": "앱 설정에서 확인할 수 있는 Govee API 키입니다. 모든 API 요청을 인증하는 데 사용됩니다."}'),
('govee', 'ko', 3,                                                                                     '기기 추가','Govee 앱에서 기기를 추가하고 기기 이름을 확인해 두세요. 제어할 기기를 식별해야 하기 때문입니다.', '{}'),
('govee', 'ko', 4,                                                                                     '자격 증명 입력','API 키를 붙여넣으세요. 그런 다음 기기 MAC 주소를 입력하세요(앱 내 기기 정보에서 확인 가능, 형식: XX:XX:XX:XX:XX:XX).','{"api_key": "앱 설정에서 확인할 수 있는 Govee API 키입니다. 모든 API 요청을 인증하는 데 사용됩니다.", "device_id": "Govee 기기의 MAC 주소입니다. Govee 앱의 기기 정보 페이지에서 확인할 수 있습니다. 형식: XX:XX:XX:XX:XX:XX"}'),
('govee', 'ko', 5,                                                                                     '연결 테스트','"Test Credentials"를 클릭하여 저장하기 전에 정상적으로 작동하는지 확인하세요.','{}');
                                                                                                                     
-- Insert Philips Hue guides (English only for now)                                                                  
INSERT INTO brand_setup_guides(brand_id, language_code, step_order, title, content, help_fields) VALUES         
('hue', 'ko', 1,                                                                                 '브리지 위치 확인','네트워크에 연결된 Hue Bridge(물리적 허브)가 필요합니다. 없다면 새로 구비해야 합니다.','{}'),
('hue', 'ko', 2,                                                                                 '브리지 IP 주소','공유기에서 Bridge의 IP 주소를 찾으세요. "Philips Hue Bridge"라는 이름의 기기를 찾거나 공식 Hue 앱을 사용하여 확인할 수 있습니다.','{"bridge_ip": "네트워크 내 Hue Bridge의 IP 주소입니다. 예: 192.168.1.50"}'),
('hue', 'ko', 3,                                                                                 '토큰 생성','http://[BRIDGE_IP]/debug/clip.html 주소로 Bridge에 접속하세요. Bridge의 버튼을 누른 후 사용자를 생성하세요. 반환된 사용자 이름(이것이 API 키입니다)을 복사하세요.','{"api_key": "Bridge에서 생성된 API 키(사용자 이름)입니다. Bridge 설정에서 확인할 수 있습니다."}'),
('hue', 'ko', 4,                                                                                 '조명 식별자','Hue 앱에서 조명 ID 또는 이름을 찾으세요. 제어할 조명을 식별하는 데 사용됩니다.','{"light_id": "제어하려는 조명의 ID 또는 이름입니다. Hue 앱에서 확인할 수 있습니다."}'),
('hue', 'ko', 5,                                                                                 '연결 테스트','"Test Credentials"를 클릭하여 Bridge가 응답하고 토큰이 유효한지 확인하세요.','{}');
                                                                                                                     
-- Insert LIFX guides (English only for now)                                                                         
INSERT INTO brand_setup_guides(brand_id, language_code, step_order, title, content, help_fields) VALUES         
('lifx', 'ko', 1,                                                                                       'API 키 가져오기','https://cloud.lifx.com/settings에 접속하여 API 토큰을 생성하세요.','{}'),
('lifx', 'ko', 2,                                                                                       '토큰 복사','개인 API 토큰이 표시됩니다. 복사해 두세요. 다시는 확인할 수 없습니다!','{"api_key": "https://cloud.lifx.com/settings에서 발급받은 LIFX 개인 API 토큰입니다."}'),
('lifx', 'ko', 3,                                                                                       '기기 선택기 찾기','LIFX 앱 또는 https://cloud.lifx.com에서 기기 라벨이나 ID를 찾으세요. "all"을 사용하여 모든 기기를 제어할 수도 있습니다.','{"selector": "LIFX 기기 선택자입니다. 기기 이름, ID, 그룹 이름 또는 'all'을 사용할 수 있습니다. 예: Living Room Light"}'),
('lifx', 'ko', 4,                                                                                       '자격 증명 입력','API 토큰을 붙여넣으세요. 기기 식별자(예: "Living Room Light" 또는 "all")를 입력하세요.','{"api_key": "https://cloud.lifx.com/settings에서 발급받은 LIFX 개인 API 토큰입니다.", "selector": "LIFX 기기 선택자입니다. 기기 이름, ID, 그룹 이름 또는 'all'을 사용할 수 있습니다. 예: Living Room Light"}'),
('lifx', 'ko', 5,                                                                                       '연결 테스트','"Test Credentials"를 클릭하여 토큰과 기기에 접근 가능한지 확인하세요.','{}');
                                                                                                                     
-- Insert WiZ guides (English only for now)                                                                          
INSERT INTO brand_setup_guides(brand_id, language_code, step_order, title, content, help_fields) VALUES         
('wiz', 'ko', 1,                                                                                         '컨트롤러 위치 확인','로컬 네트워크에서 WiZ 기기의 IP 주소를 찾으세요. 공유기나 WiZ 앱에서 확인할 수 있습니다.', '{}'),
('wiz', 'ko', 2,                                                                                         '인증 토큰 가져오기','WiZ 앱을 사용하여 로컬 접속용 API 토큰 또는 인증 키를 생성하세요.','{"api_key": "WiZ 기기 로컬 API 접근을 위한 인증 토큰입니다."}'),
('wiz', 'ko', 3,                                                                                         'IP 및 토큰 입력','WiZ 기기 IP 주소와 인증 토큰을 입력하세요.','{"device_ip": "로컬 네트워크 내 WiZ 기기의 IP 주소입니다. 예: 192.168.1.100", "api_key": "WiZ 기기 로컬 API 접근을 위한 인증 토큰입니다."}'),
('wiz', 'ko', 4,                                                                                         '연결 테스트','"Test Credentials"를 클릭하여 기기가 올바르게 응답하는지 확인하세요.', '{}');
                                                                                                                                                                                                                                                                                    
-- Insert Nanoleaf guides (English only for now)                                                                                                                                                                                                                                    
INSERT INTO brand_setup_guides(brand_id, language_code, step_order, title, content, help_fields) VALUES                                                                                                                                                                        
('nanoleaf', 'ko', 1,                                                                               '컨트롤러 위치 확인','Nanoleaf 컨트롤러의 IP 주소를 확인하세요. Nanoleaf 앱이나 공유기 설정을 통해 확인할 수 있습니다.','{}'),
('nanoleaf', 'ko', 2,                                                                               'API 활성화','Nanoleaf 기기는 로컬 API를 실행합니다. 기기의 IP 주소와 인증 토큰만 있으면 됩니다.','{}'),
('nanoleaf', 'ko', 3,                                                                               '토큰 생성','전원 버튼을 5초간 길게 눌러 표시등이 깜빡이게 하세요. 이렇게 하면 API가 활성화됩니다. 그런 다음 다음 명령어로 토큰을 생성하세요: curl -X POST http://[IP]:[PORT]/api/v1/new','{"api_key": "Nanoleaf 기기에서 생성된 인증 토큰입니다."}'),
('nanoleaf', 'ko', 4,                                                                               '세부 정보 입력','Nanoleaf 기기 IP와 생성한 인증 토큰을 입력하세요.','{"device_ip": "로컬 네트워크 내 Nanoleaf 기기의 IP 주소입니다. 예: 192.168.1.100", "api_key": "Nanoleaf 기기에서 생성된 인증 토큰입니다."}'),
('nanoleaf', 'ko', 5,                                                                               '연결 테스트','"Test Credentials"를 클릭하여 기기와의 로컬 연결을 확인하세요.','{}');
                                                                                                                     
-- Insert TP-Link Kasa guides (English only for now)                                                                 
INSERT INTO brand_setup_guides(brand_id, language_code, step_order, title, content, help_fields) VALUES         
('kasa', 'ko', 1,                                                                               '기기 IP 찾기','Kasa 앱을 사용하거나 공유기 설정을 확인하여 기기의 로컬 IP 주소를 찾으세요.','{}'),
('kasa', 'ko', 2,                                                                               '기기 IP 확인','Kasa 스마트 기기는 로컬 API를 실행합니다. 네트워크 내의 IP 주소만 있으면 됩니다.','{}'),
('kasa', 'ko', 3,                                                                               '로컬 접속 확인','포털 서버가 기기에 연결할 수 있는지 확인하세요. VPN이나 ​​방화벽 뒤에 있는 기기는 작동하지 않을 수 있습니다.','{}'),
('kasa', 'ko', 4,                                                                               'IP 입력','기기 IP 주소를 192.168.1.50 형식으로 입력하세요.','{"device_ip": "로컬 네트워크 내 Kasa 기기의 IP 주소입니다. 예: 192.168.1.100"}'),
('kasa', 'ko', 5,                                                                               '연결 테스트','"Test Credentials"를 클릭하여 기기 연결 여부를 확인하세요.','{}');
                                                                                                                     
-- Insert Yeelight guides (English only for now)                                                                     
INSERT INTO brand_setup_guides(brand_id, language_code, step_order, title, content, help_fields) VALUES         
('yeelight', 'ko', 1,                                                                               '기기 IP 찾기','Yeelight 앱에서 기기 설정(Device Settings)으로 이동하세요. 기기 IP 주소를 확인할 수 있습니다.','{}'),
('yeelight', 'ko', 2,                                                                               '로컬 제어 활성화','Yeelight 앱의 기기 설정에서 "Local Network Control(로컬 네트워크 제어)"이 활성화되어 있는지 확인하세요.','{}'),
('yeelight', 'ko', 3,                                                                               'IP 확인','설정 페이지에서 기기 IP를 복사하세요.','{"device_ip": "로컬 네트워크 내 Yeelight 기기의 IP 주소입니다. 예: 192.168.1.100"}'),
('yeelight', 'ko', 4,                                                                               'IP 주소 입력','Yeelight 기기 IP 주소를 입력하세요.','{"device_ip": "로컬 네트워크 내 Yeelight 기기의 IP 주소입니다. 예: 192.168.1.100"}'),
('yeelight', 'ko', 5,                                                                               '연결 테스트','"Test Credentials"를 클릭하여 네트워크상에서 기기 연결이 가능한지 확인하세요.','{}');
                                                                                                                                                                                                                                                                                    
-- Insert WLED guides (English only for now)                                                                                                                                                                                                                                        
INSERT INTO brand_setup_guides(brand_id, language_code, step_order, title, content, help_fields) VALUES                                                                                                                                                                        
('wled', 'ko', 1,                                                                                       '기기 IP 찾기','WLED 장치에 연결하세요. 공유기 설정이나 WLED 웹 인터페이스에서 IP 주소를 확인할 수 있습니다.','{}'),
('wled', 'ko', 2,                                                                                       '로컬 제어','WLED 장치는 로컬 API를 실행합니다. 일반적으로 별도의 인증 절차 없이 장치 IP만 있으면 됩니다.','{}'),
('wled', 'ko', 3,                                                                                       '접속 테스트','포털에서 해당 장치에 접근할 수 있는지(동일 네트워크 또는 VPN 연결 등) 확인하세요.','{}'),
('wled', 'ko', 4,                                                                                       'IP 입력','WLED 장치의 IP 주소를 입력하세요.','{"device_ip": "로컬 네트워크 내 WLED 기기의 IP 주소입니다. 예: 192.168.1.100"}'),
('wled', 'ko', 5,                                                                                       '연결 테스트','"Test Credentials(자격 증명 테스트)"를 클릭하여 장치가 응답하는지 확인하세요.','{}');
                                                                                                                     
-- Insert Wyze guides (English only for now)                                                                         
INSERT INTO brand_setup_guides(brand_id, language_code, step_order, title, content, help_fields) VALUES         
('wyze', 'ko', 1,                                                                                       '지원되지 않음','현재 Wyze와의 직접적인 API 연동은 지원되지 않습니다. OAuth를 통한 연동 방식을 검토 중입니다.','{}'),
('wyze', 'ko', 2,                                                                                       '추가 정보','Wyze 지원 관련 업데이트 소식을 추후 확인해 주세요.','{}');
                                                                                                                     
-- Insert Amazon Alexa guides (English only for now)                                                                 
INSERT INTO brand_setup_guides(brand_id, language_code, step_order, title, content, help_fields) VALUES         
('amazon', 'ko', 1,                                                                             '외부 앱','Amazon Alexa 연동은 외부 연동 방식을 사용합니다. 공식 Alexa 앱을 통해 Alexa 장치를 제어하세요.','{}'),
('amazon', 'ko', 2,                                                                             '출시 예정','향후 업데이트를 통해 Alexa와의 직접(네이티브) 연동 기능을 제공할 예정입니다.','{}');
