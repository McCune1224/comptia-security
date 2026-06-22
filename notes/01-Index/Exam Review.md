
Question 13Incorrect
Reed & Jamario Security Services has recommended your company use a port based system to prevent unauthorized users and devices. Which of the following are they recommending?
Your answer is incorrect
IDS
Fail-open
Fail-closed
Correct answer
802.1X
Overall explanation

OBJ: 3.2 - 802.1x is a standard developed by the IEEE to govern port-based network access. When used with a RADIUS based authentication server it provides authentication services, checking user credentials to ensure that the user is a legitimate part of the organization and granting access to only those areas of the system that the user is allowed to access. Fail-open refers to what happens when a network encounters errors and exceptions.  Fail-open means that when errors occur or exceptions are encountered, the system continues allowing access rather than denying access. Fail-open allows a website to continue offering services even after an error has occurred. The emphasis is, therefore, keeping the website up while the error is addressed, hoping that the error is a minor issue. An intrusion detection system (IDS) monitors network traffic for malicious activities. It alerts to the potential activity but does not prevent it from passing through the network.  In this way, it provides a layer of protection without slowing down network performance. Fail-close refers to what happens when a network encounters errors and exceptions. Fail-close means that when errors occur or exceptions are encountered, the system denies further access. This prevents any further network traffic until the error or exception are dealt with.  While this provides greater security, it means that a website can’t be accessed even if the error encountered is minor or doesn’t pose a security threat.
Domain
Security Architecture
Question 18Incorrect
Susan, a security analyst at Kelly Innovations LLC, is reviewing alerts from the IPS. She recognizes a pattern of false positives from signature-based detections. Which of the following is the MOST likely cause for false positives in signature-based detection systems?
Signature databases are stored in volatile memory.
Your answer is incorrect
The system is only updated with old signatures.
Correct answer
The signatures require tuning.
The IPS is scanning encrypted traffic only.
Overall explanation

OBJ: 4.5 - When signatures are overly broad or not precisely defined, they might incorrectly match legitimate network traffic, leading to false positives. Signature-based detection works by inspecting traffic patterns, whether encrypted or not. However, the encrypted nature of traffic isn't the primary reason for false positives in signature-based detection. While outdated signatures might miss newer threats, they aren't typically the cause of false positives. Instead, they might lead to false negatives. Where the signature database is stored does not influence the accuracy of the detection. It's the quality and precision of the signatures that matter most.
Domain
Security Operations
Question 20Incorrect
To improve security at their law firm, Norah, a security analyst wants to implement a system that will selectively block or allow traffic based on the nature of the communication. Which firewall type would be MOST effective for this purpose?
802.1x
Your answer is incorrect
Layer 4 Firewall
Correct answer
Layer 7 Firewall
VPN
Overall explanation

OBJ: 3.2 - A Layer 7 firewall operates at the application layer and can make more granular decisions about the traffic based on the application-payload, which makes it the most effective choice in this scenario. 802.1x is a standard developed by the IEEE to govern port-based network access. When used with a RADIUS based authentication server it provides authentication services, checking user credentials to ensure that the user is a legitimate part of the organization and granting access to only those areas of the system that the user is allowed to access. A Layer 4 Firewall operates at the transport layer which provides less granularity for blocking or allowing traffic based on the application-payload. A VPN provides a secure method for remote operations by creating an encrypted connection over the internet. It establishes a secure tunnel so that data can be securely transferred even over insecure networks.
Domain
Security Architecture
Question 26Incorrect
When considering the RSA algorithm, which description BEST captures its underlying mathematical property used for public key cryptography?
Correct answer
Trapdoor function
Digital signature
Symmetric encryption
Your answer is incorrect
Hash function
Overall explanation

OBJ: 1.4 - The RSA algorithm uses a trapdoor function, where encryption is easy to perform using the public key, but reversing the process (decryption) without the private key is challenging. RSA's principle is that certain mathematical operations are easy to perform, but their inverse operations are difficult without specific knowledge. Symmetric encryption is a type of encryption where the same key is used for both encryption and decryption, unlike RSA which uses a pair of public and private keys. A hash function is a process that converts an input (often a long string) into a fixed-size value, commonly used for verifying data integrity but not specifically tied to RSA's public key cryptography. A digital signature is a means to verify the authenticity of a digital message or document, using a combination of hashing and encryption, but it isn't the mathematical property of RSA.
Domain
General Security Concepts
Question 30Incorrect
Reed, a cybersecurity specialist at Dion Training Solutions, is optimizing the company's IPS. He notes that while signature-based detection is highly effective against known threats, it has some limitations. Which of the following BEST describes a limitation of signature-based detection in an IPS?
Your answer is incorrect
It requires substantial network bandwidth to operate.
It automatically updates with behavioral patterns of users.
It encrypts network traffic to hide malicious signatures.
Correct answer

It might not detect zero-day exploits.
Overall explanation

OBJ: 4.5 - Signature-based detection relies on a database of known threat patterns. Therefore, it might not recognize or stop new threats or zero-day exploits because their signatures aren't in the database yet. Automatically updating with behavioral patterns of users describes behavior-based or heuristic detection, not signature-based detection. Signature-based detection relies on predefined patterns of known threats.  Signature-based detection doesn't encrypt traffic. Instead, it matches traffic patterns against known threat signatures.  While an IPS does process traffic, the bandwidth consumption is not a direct limitation of signature-based detection. The bandwidth concern is more about the throughput of the IPS device itself. 
Domain
Security Operations
Question 32Incorrect

Kelly Innovations Corp, an IT company, is implementing a process of encryption where two parties establish a shared secret for communication purposes. Which of the following MOST accurately describes this process?
Hashing
Asymmetric encryption
Your answer is incorrect
Symmetric encryption
Correct answer
Key exchange
Overall explanation

OBJ: 1.4 - Key exchange is a process in which two communicating parties establish a shared secret key, typically used for symmetric encryption. This key is established in a manner so that eavesdroppers, even if they intercept the key exchange messages, cannot determine the shared key. The most common method for key exchange is the Diffie-Hellman protocol.  Asymmetric encryption uses different keys for encryption and decryption, but it doesn't involve the exchange of cryptographic keys. Symmetric encryption the same key for both encryption and decryption, but it doesn't involve the exchange of cryptographic keys. Hashing involves converting input data (often called a message) into a fixed-length string of bytes. It's primarily used for data integrity checks and is not reversible, meaning you cannot retrieve the original input from its hash. Therefore, it isn't suitable for the purpose of exchanging cryptographic keys or establishing shared secrets for communication.
Domain
General Security Concepts
Question 35Incorrect
Clumsy Contraptions Engineering is seeking to change its security footing. In the past, they have found that too many pieces of malicious software have gotten past the system. Their Chief Security Officer believes they need a device which will actively evaluate traffic and reject or modify packets according to policies the company sets. What type of device is the CSO suggesting?
Your answer is incorrect
Fail-close
Correct answer
Inline
SASE
Remote Access
Overall explanation

OBJ: 3.2 - Inline devices are designed to interact with network traffic actively and can take actions such as accepting, rejecting, or modifying packets, making them the optimal choice for this scenario. Secure Access Service Edge (SASE) is a form of cloud architecture that combines a number of services as a single service.  By providing services like Software-defined wide are network (SD-WAN), firewalls as a service, secure web gateways, and zero-trust network access, SASE will reduce cost and simplify management while improving security.  The integrated nature of the architecture means the technologies used will work together efficiently. It may include a packet analyzer, but that isn't the focus of the architecture. Fail-close refers to what happens when a network encounters errors and exceptions. Fail-close means that when errors occur or exceptions are encountered, the system denies further access. This prevents any further network traffic until the error or exception are dealt with.  While this provides greater security, it means that a website can’t be accessed even if the error encountered is minor or doesn’t pose a security threat. This is a response to errors and exceptions, it doesn't read and interact with packets. Remote access allows users to connect to a network or a device from a distant location, but it does not pertain to actively interacting with network traffic to reject or modify packets.
Domain
Security Architecture
Question 40Incorrect
When sending an encrypted message to Dion Training, a client would use which of the following to ensure only Dion Training can decrypt and read the message?
Wildcard certificate
Your answer is incorrect
Private key
Key escrow
Correct answer
Public key
Overall explanation

OBJ: 1.4 - The client would use the company's public key to encrypt the message. Only Dion Training, with the corresponding private key, can decrypt and read the message, ensuring confidentiality and demonstrating the importance of public-key cryptography. Key escrow refers to the secure storage of cryptographic keys, ensuring they can be accessed under specific conditions, but it's not directly used to encrypt or decrypt messages. A private key is kept secret by its holder and is used to decrypt messages that are encrypted with its corresponding public key. It's not used by external entities to encrypt messages to the key holder. A wildcard certificate secures multiple subdomains under a main domain but doesn't directly involve message encryption or decryption.
Domain
General Security Concepts
Question 44Incorrect
The executive team at a software development firm decides that any project with a potential financial impact greater than $500,000 due to a security incident will require an immediate review and intervention. This financial impact figure represents which of the following in risk management?
Risk level
Your answer is incorrect
Risk tolerance
Risk limit
Correct answer
Risk threshold
Overall explanation

OBJ: 5.2 - The $500,000 financial impact figure is an example of a risk threshold, as it is the specific point at which the company must act to mitigate risk.  While risk limit is not a standard term, it could colloquially be used to describe a risk threshold, but in this context, the correct term is "risk threshold." Risk level pertains to the severity of risk and does not describe the actionable limit set by the company. Risk tolerance refers to the general level of risk the firm is willing to accept, not the precise financial impact threshold for action. 
Domain
Security Program Management and Oversight
Question 49Incorrect
Dion Training is considering a collaboration with a new IT service vendor. To ensure compliance and adherence to industry standards, Dion Training wishes to see verifiable evaluations of the vendor's security controls and practices. Which of the following would provide Dion Training with insights into the vendor's own internal evaluations of their security measures?
Customer testimonials
Correct answer
Evidence of internal audits
Your answer is incorrect
Regulatory compliance certificates
External penetration test reports
Overall explanation

OBJ: 5.3 - Evidence of Internal Audits showcases a vendor's proactive approach to maintaining and enhancing their security measures. Such audits are conducted internally and reflect a rigorous self-assessment of security practices, vulnerabilities, and control mechanisms. By reviewing these, a company can gain insights into the vendor's commitment to security, how they address potential weaknesses, and their overall cybersecurity health. This evidence can be instrumental in gauging the reliability and trustworthiness of the vendor's internal security framework. Regulatory compliance certificates indicate compliance with specific regulations but don't provide detailed insights into internal evaluations. While customer testimonials may provide feedback on the vendor's performance, they don't offer insights into the vendor's internal evaluations of their security measures. External penetration test reports show the results of external entities testing the vendor's defenses, not the vendor's own evaluations.
Domain
Security Program Management and Oversight
Question 57Incorrect
You are a security analyst at Dion Training and you discover that an unauthorized device has been connected to the company’s network. As you investigate, you discover that the device was added so the employee could play video games during her breaks. What type of threat actor are you dealing with?
Insider Threat
Your answer is incorrect
Unskilled Actor
Correct answer
Shadow IT
Nation-state Actor
Overall explanation

OBJ: 2.1 - Shadow IT is a type of threat actor that is the result of unauthorized or unapproved IT systems or devices within an organization.  In this case, the device may introduce security risks and compliance issues for an organization, but the employee wasn't intending any harm to the company.  An unskilled threat actor is one that lacks technical expertise or sophistication. Unskilled attackers often launch simple and opportunistic attacks using tools or scripts developed by others. The employee in this case may be unskilled but the employee didn't attach the device to cause problems for the company. Nation-state actors are a type of threat actor that is sponsored by a government or a country's military. They normally have high resources/funding and high level of sophistication/capability, but they are not a part of the organization they attack. An insider threat is a type of threat actor that has authorized access to an organization’s network, systems, or data and has variable resources/funding and level of sophistication/capability depending on their role and position. Insider threats can abuse their authorized access, leak information, sabotage operations, or collaborate with external actors. They intend to harm the company by their actions.  


For support or reporting issues, include Question ID: 64b86cba381e518e73f4166c in your ticket. Thank you.
Domain
Threats, Vulnerabilities, and Mitigations
Question 62Incorrect

Within the IT department, Sarah has been designated to oversee the security measures for the new data management platform. She is accountable for the regular review of security protocols and responding to any breaches or vulnerabilities that may arise. Sarah's role would be BEST described by which of the following terms?
Correct answer

Risk owner

Risk register

Risk indicator
Your answer is incorrect

Risk assessor
Overall explanation

OBJ: 5.2 - Sarah exemplifies a risk owner, as she is tasked with the ongoing management and mitigation of risks pertaining to the data management platform. A risk register would be the tool Sarah uses to track and assess the risks, not her role. A risk indicator would be a metric Sarah might monitor to assess risk levels, not her position. A risk assessor might be a role that Sarah takes on when evaluating risks, but it does not encapsulate her comprehensive management responsibilities.
Domain
Security Program Management and Oversight
Question 68Incorrect

Which of the following terms refers to a critical predictive metric that organizations monitor to foresee potential risks and their impact on operations?
Correct answer
Key risk indicators
Your answer is incorrect
Risk metrics
Risk parameters
Risk threshold
Overall explanation

OBJ: 5.2 - KRIs are metrics that provide early warnings of increasing risk exposures, enabling organizations' leadership to manage these risks proactively. A risk threshold is the defined level of risk an organization is willing to accept, not a predictive indicator. Risk metrics are quantitative measures of risk but do not specifically refer to the predictive indicators used for monitoring potential risks. Risk parameters are specific variables used within risk assessment processes, not predictive indicators.
Domain
Security Program Management and Oversight
Question 72Incorrect
Which asymmetric encryption technique provides a comparable level of security with shorter key lengths, making it efficient for cryptographic operations?
RSA
Your answer is incorrect
DSA
Correct answer

ECC
Diffie-Hellman
Overall explanation

OBJ: 1.4 - ECC (Elliptic curve cryptography) is a type of trapdoor function that is efficient with shorter key lengths. For instance, ECC with a 256-bit key provides roughly the same security as RSA with a 2048-bit key. The primary advantage is that ECC has no known shortcuts to cracking it, making it particularly robust. Diffie-Hellman is an algorithm primarily for secure key exchange, not directly comparable to the encryption efficiency offered by ECC's shorter key lengths. Digital Signature Algorithm (DSA) is an algorithm used for digital signatures, but it doesn't inherently offer the same efficiency in terms of key length as ECC. While a foundational asymmetric algorithm, RSA generally requires longer key lengths than ECC to achieve comparable security levels.
Domain
General Security Concepts
Question 74Incorrect
Which of the following characteristics of a cloud architecture model describes a model that can quickly recover from failures due to adverse conditions?
Your answer is incorrect
Availability
Correct answer
Resilience
Ease of Deployment
Scalability
Overall explanation

OBJ: 3.1 - Resilience in cloud architecture refers to the ability of the system to quickly recover from failures and maintain operational performance, crucial for ensuring availability during adverse conditions. Availability refers to guaranteeing a system will continue to operate so that the system can be used regardless of conditions. Resilience, like availability, refers to keeping a system functioning, but also directly addresses how quickly a system can recover after adverse conditions have led to a failure. Scalability means that the system can expand when more resources are needed without creating lags or problems for users. This expansion isn't considered an adverse condition. Increased business is seen as a positive attribute. Resilience is the ability of a system to quickly recover after failures due to adverse conditions. Ease of Deployment means that new instances and the entire cloud environment can be easily created. Resilience is the ability to maintain operational performance and recover quickly from failures.

For support or reporting issues, include Question ID: 651707dd7ae092b7640ec669 in your ticket. Thank you.
Domain
Security Architecture
Question 81Incorrect

Which of the following are hardware issues that result from products that are no longer being made or supported, but are still usable?
Your answer is incorrect
Legacy vulnerability
Hardware cloning
Hardware tampering
Correct answer
End-of-life vulnerability
Overall explanation

OBJ: 2.3 - End-of-life vulnerability can allow a hardware attack that involves exploiting vulnerabilities in devices that are no longer supported or updated by the manufacturer. It can allow an attacker to compromise the security or functionality of the device, or use it as a gateway to access other systems or networks. A legacy vulnerability may allow an attack that involves exploiting vulnerabilities in devices that are outdated or obsolete, but still in use. It can allow an attacker to compromise the security or functionality of the device, or use it as a gateway to access other systems or networks. Hardware tampering is a hardware attack that involves physically altering or damaging hardware devices to compromise their functionality, performance, or security. It can allow an attacker to install malware, backdoors, spyware, or vulnerabilities on the device. Hardware cloning is a hardware attack that involves creating unauthorized copies of hardware devices to counterfeit their functionality, performance, or security. It can allow an attacker to sell fake products, steal intellectual property, or bypass authentication mechanisms.
Domain
Threats, Vulnerabilities, and Mitigations
Question 82Incorrect

Which method is used for the authentication process used in WPA2 with PSK?
QR codes for client device configuration.
Dragonfly handshake with a MAC address hash.
Correct answer
Using a passphrase to generate a pairwise master key (PMK).
Your answer is incorrect
Password Authenticated Key Exchange (PAKE).
Overall explanation

OBJ: 2.2 - WPA2-PSK leverages a passphrase to create a key, called the PMK, to encrypt communications. This is a distinguishing feature of WPA2's personal authentication. The Dragonfly handshake is a key feature of the WPA3's Simultaneous Authentication of Equals (SAE) method. This does not pertain to the WPA2 authentication mechanism. PAKE is specifically a method associated with WPA3's SAE protocol. It's not the method employed by WPA2 for authentication. QR codes for configuration relate to the newer Easy Connect method. It is not a characteristic of WPA2 Personal authentication.
Domain
Threats, Vulnerabilities, and Mitigations
Question 83Incorrect
Which of the following terms emphasizes the mathematical structure used to scramble data so that only a specific key can unscramble it?
Correct answer
Encryption algorithm
Your answer is incorrect
Digital signature
Cipher block
Hash function
Overall explanation

OBJ: 1.4 - An encryption algorithm provides a structured method for converting plaintext into ciphertext. A good algorithm ensures data remains confidential and secure from unauthorized access. Digital signatures validate the authenticity and integrity of a message or document, ensuring it hasn't been tampered with since being signed. A cipher block refers to a fixed-size portion of data that an encryption algorithm processes. It doesn't define the mathematical method itself. A hash function takes input and returns a fixed-size string, typically used for verifying data integrity, but it does not encrypt data for the purpose of confidentiality.
Domain
General Security Concepts
Question 87Incorrect
An investment firm allows a fluctuation of up to 10% in the value of its high-risk investment portfolio compared to the expected return on investment, but immediate action is required if this threshold is exceeded. This 10% fluctuation represents an example of:
Risk matrix
Correct answer
Risk tolerance
Your answer is incorrect
Risk appetite
Risk management
Overall explanation

OBJ 5.2 - The 10% fluctuation is an example of the firm's risk tolerance, which specifies the risk tolerance, which is the acceptable variance in the high-risk portfolio's performance before triggering action. Risk management is the overarching process of identifying, assessing, and responding to risks, which includes setting risk tolerance but is not represented by the 10% fluctuation itself. A risk matrix is a visual tool used to determine the severity and likelihood of risks, not the acceptable variance in investment performance. While the firm's decision to have a high-risk investment portfolio at all does reflect its risk appetite, the question specifically refers to the acceptable variance, which is the risk tolerance.
Domain
Security Program Management and Oversight