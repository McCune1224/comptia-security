Question 13Incorrect
Reed & Jamario Security Services has recommended your company use a port based system to prevent unauthorized users and devices. Which of the following are they recommending?
**Your answer is incorrect**
**IDS**
Fail-open
Fail-closed
**Correct answer**
**802.1X**
Overall explanation

OBJ: 3.2 - 802.1x is a standard developed by the IEEE to govern port-based network access. When used with a RADIUS based authentication server it provides authentication services, checking user credentials to ensure that the user is a legitimate part of the organization and granting access to only those areas of the system that the user is allowed to access. Fail-open refers to what happens when a network encounters errors and exceptions.  Fail-open means that when errors occur or exceptions are encountered, the system continues allowing access rather than denying access. Fail-open allows a website to continue offering services even after an error has occurred. The emphasis is, therefore, keeping the website up while the error is addressed, hoping that the error is a minor issue. An intrusion detection system (IDS) monitors network traffic for malicious activities. It alerts to the potential activity but does not prevent it from passing through the network.  In this way, it provides a layer of protection without slowing down network performance. Fail-close refers to what happens when a network encounters errors and exceptions. Fail-close means that when errors occur or exceptions are encountered, the system denies further access. This prevents any further network traffic until the error or exception are dealt with.  While this provides greater security, it means that a website can’t be accessed even if the error encountered is minor or doesn’t pose a security threat.

--------------

Question 18Incorrect
Susan, a security analyst at Kelly Innovations LLC, is reviewing alerts from the IPS. She recognizes a pattern of false positives from signature-based detections. Which of the following is the MOST likely cause for false positives in signature-based detection systems?
Signature databases are stored in volatile memory.
**Your answer is incorrect**
**The system is only updated with old signatures.**
**Correct answer**
**The signatures require tuning.**
The IPS is scanning encrypted traffic only.
Overall explanation

--------------

OBJ: 4.5 - When signatures are overly broad or not precisely defined, they might incorrectly match legitimate network traffic, leading to false positives. Signature-based detection works by inspecting traffic patterns, whether encrypted or not. However, the encrypted nature of traffic isn't the primary reason for false positives in signature-based detection. While outdated signatures might miss newer threats, they aren't typically the cause of false positives. Instead, they might lead to false negatives. Where the signature database is stored does not influence the accuracy of the detection. It's the quality and precision of the signatures that matter most.

--------------
Question 20Incorrect
To improve security at their law firm, Norah, a security analyst wants to implement a system that will selectively block or allow traffic based on the nature of the communication. Which firewall type would be MOST effective for this purpose?
802.1x
**Your answer is incorrect**
**Layer 4 Firewall**
**Correct answer**
**Layer 7 Firewall**
VPN
Overall explanation

OBJ: 3.2 - A Layer 7 firewall operates at the application layer and can make more granular decisions about the traffic based on the application-payload, which makes it the most effective choice in this scenario. 802.1x is a standard developed by the IEEE to govern port-based network access. When used with a RADIUS based authentication server it provides authentication services, checking user credentials to ensure that the user is a legitimate part of the organization and granting access to only those areas of the system that the user is allowed to access. A Layer 4 Firewall operates at the transport layer which provides less granularity for blocking or allowing traffic based on the application-payload. A VPN provides a secure method for remote operations by creating an encrypted connection over the internet. It establishes a secure tunnel so that data can be securely transferred even over insecure networks.

---


Question 26Incorrect
When considering the RSA algorithm, which description BEST captures its underlying mathematical property used for public key cryptography?
**Correct answer**
**Trapdoor function**
Digital signature
Symmetric encryption
**Your answer is incorrect**
**Hash function**
Overall explanation

OBJ: 1.4 - The RSA algorithm uses a trapdoor function, where encryption is easy to perform using the public key, but reversing the process (decryption) without the private key is challenging. RSA's principle is that certain mathematical operations are easy to perform, but their inverse operations are difficult without specific knowledge. Symmetric encryption is a type of encryption where the same key is used for both encryption and decryption, unlike RSA which uses a pair of public and private keys. A hash function is a process that converts an input (often a long string) into a fixed-size value, commonly used for verifying data integrity but not specifically tied to RSA's public key cryptography. A digital signature is a means to verify the authenticity of a digital message or document, using a combination of hashing and encryption, but it isn't the mathematical property of RSA.

---

