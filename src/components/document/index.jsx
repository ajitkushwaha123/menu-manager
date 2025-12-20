"use client";
import { getAmount, getDurationLabel } from "@/constants/agreement";
import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";

const PRIMARY = "#1b1cfe";

Font.register({
  family: "Poppins",
  fonts: [
    { src: "/fonts/Poppins-Regular.ttf", fontWeight: 400 },
    { src: "/fonts/Poppins-Medium.ttf", fontWeight: 500 },
    { src: "/fonts/Poppins-SemiBold.ttf", fontWeight: 600 },
    { src: "/fonts/Poppins-Bold.ttf", fontWeight: 700 },
  ],
});

const styles = StyleSheet.create({
  page: {
    fontFamily: "Poppins",
    fontSize: 10,
    lineHeight: 1.6,
    color: "#222",
    backgroundColor: "#fff",
    paddingTop: 150,
    paddingHorizontal: 45,
    paddingBottom: 40,
    position: "relative",
  },
  stripTop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 12,
    backgroundColor: PRIMARY,
  },
  headerContainer: {
    position: "absolute",
    top: 0,
    left: 45,
    right: 45,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginTop: 28,
    marginBottom: 28,
  },
  logo: { width: 120, height: 55, objectFit: "contain" },
  companyInfo: {
    width: 180,
    textAlign: "right",
    fontSize: 9.5,
    color: "#111",
    lineHeight: 1.3,
  },
  blackBold: { fontWeight: "bold" },
  blueBold: { color: PRIMARY, fontWeight: "bold" },
  headerBottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginTop: 5,
  },
  content: { marginTop: 15 },
  paragraph: { marginBottom: 10, textAlign: "justify" },
  bulletList: { marginLeft: 15, marginBottom: 10 },
  bulletItem: { flexDirection: "row", marginBottom: 4 },
  bulletDot: { marginRight: 4 },
  sectionHeading: {
    fontWeight: "bold",
    marginTop: 12,
    marginBottom: 6,
  },
  numberedHeading: {
    fontWeight: "bold",
    marginTop: 15,
    marginBottom: 6,
    fontSize: 11,
  },
  footer: { position: "absolute", bottom: 0, left: 0, right: 0 },
  footerWave: { width: "100%", height: 40 },
});

function CommonHeader({ date, company, client }) {
  return (
    <View style={styles.headerContainer} fixed>
      <View style={styles.stripTop} />
      <View style={styles.headerRow}>
        <Image src={company.logo} style={styles.logo} />
        <View style={styles.companyInfo}>
          {/* <Text>{company.address}</Text> */}
          <Text>{company.phone}</Text>
          <Text>{company.website}</Text>
        </View>
      </View>

      <View style={styles.headerBottomRow}>
        <Text>
          <Text style={styles.blackBold}>To </Text>
          <Text style={styles.blueBold}>{client.name.toUpperCase()}</Text>
        </Text>
        <Text style={styles.blackBold}>{date}</Text>
      </View>
    </View>
  );
}

function CommonFooter() {
  return (
    <View style={styles.footer}>
      <Image src="/assets/footer-wave.png" style={styles.footerWave} />{" "}
    </View>
  );
}

export default function MagicScaleAgreementPDF({
  company,
  client,
  agreement,
  payment,
}) {
  return (
    <Document
      title="Consultant Agreement"
      author={company.name}
      creator="Magic Scale"
    >
      <Page size="A4" style={styles.page}>
        <CommonHeader date={agreement.date} company={company} client={client} />
        <View style={styles.content}>
          <Text style={styles.paragraph}>
            This Agreement is made and entered into on this between{" "}
            <Text style={styles.blueBold}>
              {agreement.start} – {agreement.end}
            </Text>
          </Text>

          <Text style={styles.paragraph}>
            <Text style={styles.blueBold}>{company.name}</Text>, a
            Proprietorship having its registered office at{" "}
            <Text style={styles.blackBold}>{company.address}</Text> hereinafter
            referred to as <Text style={styles.blackBold}>“Consultant”</Text>,
            represented by {company.representative} as {company.designation}.
          </Text>

          <Text style={[styles.paragraph, { marginTop: 10 }]}>AND</Text>

          <Text style={styles.paragraph}>
            <Text style={styles.blueBold}>{client.name.toUpperCase()}</Text>, a
            Proprietorship having its{" "}
            <Text style={styles.blackBold}>{client.address}</Text> hereinafter
            referred to as <Text style={styles.blackBold}>“Client”</Text>,
            represented by{" "}
            <Text style={styles.blackBold}>{client.representative}</Text>.
          </Text>

          <Text style={styles.sectionHeading}>WHEREAS:</Text>

          <View style={styles.bulletList}>
            {[
              `The Client operates a restaurant known as ${client.name}.`,
              "The Client desires to improve its business performance and has engaged the Consultant to provide consulting services.",
              "The Consultant has agreed to provide such services on the terms and conditions set forth herein.",
            ].map((item, i) => (
              <View style={styles.bulletItem} key={i}>
                <Text style={styles.bulletDot}>•</Text>
                <Text>{item}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.paragraph}>
            NOW, Therefore, in consideration of the mutual covenants and
            promises contained herein, the parties agree as follows:
          </Text>

          <Text style={styles.sectionHeading}>1. Scope of Services</Text>

          <Text style={styles.paragraph}>
            The <Text style={styles.blackBold}>Consultant</Text> shall provide
            professional{" "}
            <Text style={styles.blueBold}>
              consultancy and management services
            </Text>{" "}
            to improve the{" "}
            <Text style={styles.blackBold}>Client’s business performance</Text>,
            including but not limited to:
          </Text>

          <View style={styles.bulletList}>
            {[
              "Restaurant onboarding and account setup on Zomato and Swiggy.",
              "Menu analysis, optimization, and pricing strategy.",
              "Marketing and promotional strategy implementation.",
              "Weekly performance tracking and reporting.",
            ].map((item, i) => (
              <View style={styles.bulletItem} key={i}>
                <Text style={styles.bulletDot}>•</Text>
                <Text>{item}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.paragraph}>
            The Consultant’s services aim to achieve a{" "}
            <Text style={styles.blueBold}>
              {getDurationLabel(agreement.duration)} sales growth target
            </Text>{" "}
            between{" "}
            <Text style={styles.blueBold}>
              ₹{agreement.targetLowerBound.toLocaleString()} – ₹
              {agreement.targetUpperBound.toLocaleString()}
            </Text>{" "}
            {agreement.services === "both" ? (
              <>
                (through <Text style={styles.blueBold}>Zomato</Text> and{" "}
                <Text style={styles.blueBold}>Swiggy</Text> combined)
              </>
            ) : agreement.services === "zomato" ? (
              <>
                (through <Text style={styles.blueBold}>Zomato</Text> only)
              </>
            ) : (
              <>
                (through <Text style={styles.blueBold}>Swiggy</Text> only)
              </>
            )}
            , compared to the previous month’s performance.
          </Text>

          <Text style={styles.paragraph}>
            <Text style={styles.blackBold}>Note :- </Text>
            <Text style={{ color: "red", fontWeight: "bold" }}>
              If the food quality or a rating above 3.8 is not maintained by the
              client, then we are not responsible for achieving the target.
            </Text>
          </Text>
        </View>
        <CommonFooter />
      </Page>

      <Page size="A4" style={styles.page}>
        <CommonHeader date={agreement.date} company={company} client={client} />

        <View style={styles.content}>
          <Text style={styles.sectionHeading}>2. Term and Termination</Text>
          <Text style={styles.paragraph}>
            This Agreement shall be valid for a period of{" "}
            <Text style={styles.blueBold}>
              {agreement.duration}{" "}
              {agreement.duration === "1" ? "month" : "months"}{" "}
            </Text>
            , commencing on{" "}
            <Text style={styles.blueBold}>{agreement.start}</Text> and expiring
            on <Text style={styles.blueBold}>{agreement.end}</Text>.
          </Text>
          <Text style={styles.paragraph}>
            Either party may terminate this Agreement with{" "}
            <Text style={styles.blueBold}>15 days’ written notice</Text>. If the
            growth target is not achieved, Consultant may extend the service
            period at no additional cost.
          </Text>
          <Text style={styles.sectionHeading}>3. Fees and Payment Terms</Text>
          <Text style={styles.paragraph}>
            The Client agrees to pay the Consultant a{" "}
            <Text style={styles.blueBold}>
              total service fee of {getAmount(agreement.fee)}.{" "}
            </Text>
            <Text style={styles.paragraph}>
              A <Text style={styles.blueBold}>weekly</Text> advertising budget
              of <Text style={styles.blueBold}>₹1500</Text> for Zomato
              promotions will be borne by the client.
            </Text>
          </Text>
          <Text style={[styles.paragraph, styles.blackBold]}>
            Payment Terms:
          </Text>
          <View style={styles.bulletList}>
            {payment.term === "partial" ? (
              <>
                <View style={styles.bulletItem}>
                  <Text style={styles.bulletDot}>• </Text>
                  <Text>
                    <Text style={styles.blueBold}>{payment.firstHalf}% </Text>
                    advance payment upon signing of this
                    <Text style={styles.blackBold}> Agreement</Text>.
                  </Text>
                </View>

                <View style={styles.bulletItem}>
                  <Text style={styles.bulletDot}>• </Text>
                  <Text>
                    <Text style={styles.blueBold}>{payment.secondHalf}% </Text>
                    upon completion of the service term or achievement of the
                    <Text style={styles.blackBold}> growth target</Text>.
                  </Text>
                </View>
              </>
            ) : (
              <>
                <Text style={styles.paragraph}>
                  <Text style={styles.blackBold}>Note:</Text> The full advance
                  amount will be collected by the{" "}
                  <Text style={styles.blackBold}>Consultant</Text> at the time
                  of accepting the agreement by client.
                </Text>
              </>
            )}

            <View style={styles.bulletItem}>
              <Text style={styles.bulletDot}>• </Text>
              <Text>
                All payments shall be made via
                <Text style={styles.blueBold}> bank transfer or UPI</Text> to
                the
                <Text style={styles.blackBold}>
                  {" "}
                  Consultant’s designated account
                </Text>
                .
              </Text>
            </View>
          </View>
          <Text style={styles.sectionHeading}>
            {" "}
            4. Responsibilities of the Parties{" "}
          </Text>{" "}
          <Text style={[styles.paragraph, styles.blackBold]}>
            {" "}
            Consultant Responsibilities:{" "}
          </Text>{" "}
          <View style={styles.bulletList}>
            {" "}
            <View style={styles.bulletItem}>
              {" "}
              <Text style={styles.bulletDot}>•</Text>{" "}
              <Text>
                {" "}
                Provide{" "}
                <Text style={styles.blueBold}>
                  {" "}
                  consultancy and management services{" "}
                </Text>{" "}
                professionally and efficiently.{" "}
              </Text>{" "}
            </View>{" "}
            <View style={styles.bulletItem}>
              {" "}
              <Text style={styles.bulletDot}>•</Text>{" "}
              <Text>
                {" "}
                Maintain <Text style={styles.blackBold}>
                  confidentiality
                </Text>{" "}
                and provide{" "}
                <Text style={styles.blueBold}>regular performance updates</Text>{" "}
                .{" "}
              </Text>{" "}
            </View>{" "}
            <View style={styles.bulletItem}>
              {" "}
              <Text style={styles.bulletDot}>•</Text>{" "}
              <Text>
                {" "}
                Ensure{" "}
                <Text style={styles.blueBold}>
                  transparent communication
                </Text>{" "}
                and <Text style={styles.blackBold}>strategy alignment</Text>.{" "}
              </Text>{" "}
            </View>{" "}
          </View>{" "}
          <Text style={[styles.paragraph, styles.blackBold]}>
            {" "}
            Client Responsibilities:{" "}
          </Text>{" "}
          <View style={styles.bulletList}>
            {" "}
            <View style={styles.bulletItem}>
              {" "}
              <Text style={styles.bulletDot}>•</Text>{" "}
              <Text>
                {" "}
                Provide necessary access to{" "}
                <Text style={styles.blueBold}>Zomato</Text>/{" "}
                <Text style={styles.blueBold}>Swiggy</Text> accounts, sales
                data, and required information.{" "}
              </Text>{" "}
            </View>{" "}
            <View style={styles.bulletItem}>
              {" "}
              <Text style={styles.bulletDot}>•</Text>{" "}
              <Text>
                {" "}
                Maintain consistent{" "}
                <Text style={styles.blackBold}>food quality</Text> and{" "}
                <Text style={styles.blueBold}>customer service</Text>.{" "}
              </Text>{" "}
            </View>{" "}
            <View style={styles.bulletItem}>
              {" "}
              <Text style={styles.bulletDot}>•</Text>{" "}
              <Text>
                {" "}
                Make <Text style={styles.blueBold}>timely payments</Text> as
                agreed.{" "}
              </Text>{" "}
            </View>{" "}
          </View>
          <Text style={styles.sectionHeading}>5. Confidentiality</Text>{" "}
          <Text style={styles.paragraph}>
            {" "}
            Both parties agree to keep{" "}
            <Text style={styles.blackBold}>confidential</Text> all{" "}
            <Text style={styles.blueBold}>
              {" "}
              information, data, and trade secrets{" "}
            </Text>{" "}
            shared during the term of this{" "}
            <Text style={styles.blackBold}>Agreement</Text>.{" "}
          </Text>
        </View>
        <CommonFooter />
      </Page>

      {/* PAGE 3 */}
      <Page size="A4" style={styles.page}>
        <CommonHeader date={agreement.date} company={company} client={client} />

        <View style={styles.content}>
          <View style={styles.content}>
            {" "}
            <Text style={styles.sectionHeading}>
              6. Limitation of Liability
            </Text>{" "}
            <Text style={styles.paragraph}>
              {" "}
              The <Text style={styles.blackBold}>Consultant</Text> shall not be
              liable for any{" "}
              <Text style={styles.blueBold}>
                {" "}
                indirect, incidental, or consequential damages{" "}
              </Text>{" "}
              arising from the services provided.{" "}
            </Text>{" "}
            <Text style={styles.paragraph}>
              {" "}
              <Text style={styles.blackBold}>Liability</Text>, if any, shall be
              limited to the{" "}
              <Text style={styles.blueBold}>total amount paid</Text> under this{" "}
              <Text style={styles.blackBold}>Agreement</Text>.{" "}
            </Text>{" "}
            <Text style={styles.sectionHeading}>7. Intellectual Property</Text>{" "}
            <Text style={styles.paragraph}>
              {" "}
              All{" "}
              <Text style={styles.blueBold}>
                {" "}
                reports, marketing materials, and strategic recommendations{" "}
              </Text>{" "}
              prepared by the <Text style={styles.blackBold}>
                Consultant
              </Text>{" "}
              shall remain the{" "}
              <Text style={styles.blackBold}>
                {" "}
                Consultant’s intellectual property{" "}
              </Text>{" "}
              unless otherwise agreed in{" "}
              <Text style={styles.blueBold}>writing</Text>.{" "}
            </Text>{" "}
            <Text style={styles.sectionHeading}>8. Entire Agreement</Text>{" "}
            <Text style={styles.paragraph}>
              {" "}
              This <Text style={styles.blackBold}>Agreement</Text> constitutes
              the <Text style={styles.blueBold}>entire understanding</Text>{" "}
              between the parties and{" "}
              <Text style={styles.blackBold}>supersedes</Text> all prior{" "}
              <Text style={styles.blueBold}>
                {" "}
                discussions, negotiations, or agreements{" "}
              </Text>{" "}
              , whether written or oral.{" "}
            </Text>{" "}
          </View>

          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              marginTop: 40,
              paddingTop: 20,
            }}
          >
            <View style={{ width: "50%" }}>
              <Text style={styles.blackBold}>{company.name}</Text>
              <Text style={[styles.blackBold, { marginTop: 4 }]}>
                {company.designation}
              </Text>
              <Text style={styles.blueBold}>{company.representative}</Text>

              <Image
                src="/assets/signature.png"
                style={{ width: 120, height: 60, objectFit: "contain" }}
              />
            </View>

            <View style={{ width: "45%", textAlign: "right" }}>
              <Text style={styles.blackBold}>{client.name.toUpperCase()}</Text>
              <Text style={styles.blueBold}>{client.representative}</Text>
            </View>
          </View>
        </View>
        <CommonFooter />
      </Page>
    </Document>
  );
}
